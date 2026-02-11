import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch all confirmed/ready orders with time slots and add-ons
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_bagels, total_price, status, time_slot_id, time_slots(date), order_add_ons(quantity, add_on_type_id)')
      .in('status', ['confirmed', 'ready'])
      .eq('is_fake', false);

    if (ordersError) {
      console.error('Supabase error:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      );
    }

    // Fetch all ingredients grouped by cost type
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*');

    if (ingredientsError) {
      console.error('Supabase error:', ingredientsError);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients', details: ingredientsError.message },
        { status: 500 }
      );
    }

    // Separate ingredients by cost type
    const perBagelIngredients = (ingredients || []).filter(i => (i.cost_type || 'per_bagel') === 'per_bagel');
    const perAddonIngredients = (ingredients || []).filter(i => i.cost_type === 'per_addon');
    const fixedCosts = (ingredients || []).filter(i => i.cost_type === 'fixed');

    // Per-bagel cost
    const costPerBagelFromIngredients = perBagelIngredients.reduce(
      (sum, ing) => sum + Number(ing.cost_per_unit) * Number(ing.units_per_bagel),
      0
    );

    // Build a map of add-on cost per unit: add_on_type_id → cost
    const addonCostMap: Record<string, number> = {};
    for (const ing of perAddonIngredients) {
      if (ing.add_on_type_id) {
        addonCostMap[ing.add_on_type_id] = (addonCostMap[ing.add_on_type_id] || 0) + Number(ing.cost_per_unit);
      }
    }

    // Total fixed costs
    const totalFixedCosts = fixedCosts.reduce(
      (sum, ing) => sum + Number(ing.cost_per_unit),
      0
    );

    // Group orders by date
    const dailyMap: Record<string, {
      orders: number;
      bagels_sold: number;
      revenue: number;
      addon_cogs: number;
    }> = {};

    let grandTotalBagels = 0;

    for (const order of orders || []) {
      const timeSlot = order.time_slots as unknown as { date: string } | null;
      const date = timeSlot?.date;
      if (!date) continue;

      // Apply date filters
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;

      if (!dailyMap[date]) {
        dailyMap[date] = { orders: 0, bagels_sold: 0, revenue: 0, addon_cogs: 0 };
      }

      dailyMap[date].orders += 1;
      dailyMap[date].bagels_sold += order.total_bagels;
      dailyMap[date].revenue += Number(order.total_price);
      grandTotalBagels += order.total_bagels;

      // Calculate add-on COGS for this order
      const addOns = order.order_add_ons as unknown as { quantity: number; add_on_type_id: string }[] || [];
      for (const addon of addOns) {
        const unitCost = addonCostMap[addon.add_on_type_id] || 0;
        dailyMap[date].addon_cogs += addon.quantity * unitCost;
      }
    }

    // Build daily financials array
    const dailyFinancials = Object.entries(dailyMap)
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
      .map(([date, data]) => {
        const bagelCogs = data.bagels_sold * costPerBagelFromIngredients;
        // Amortize fixed costs proportionally by bagels sold this day
        const fixedCogsPortion = grandTotalBagels > 0
          ? totalFixedCosts * (data.bagels_sold / grandTotalBagels)
          : 0;
        const cogs = bagelCogs + data.addon_cogs + fixedCogsPortion;
        const profit = data.revenue - cogs;
        const profit_margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

        return {
          date,
          orders: data.orders,
          bagels_sold: data.bagels_sold,
          revenue: data.revenue,
          cogs,
          profit,
          profit_margin,
        };
      });

    // Calculate summary totals
    const summary = dailyFinancials.reduce(
      (acc, day) => ({
        total_revenue: acc.total_revenue + day.revenue,
        total_cogs: acc.total_cogs + day.cogs,
        total_profit: acc.total_profit + day.profit,
        total_orders: acc.total_orders + day.orders,
        total_bagels: acc.total_bagels + day.bagels_sold,
      }),
      { total_revenue: 0, total_cogs: 0, total_profit: 0, total_orders: 0, total_bagels: 0 }
    );

    const avg_order_value =
      summary.total_orders > 0 ? summary.total_revenue / summary.total_orders : 0;
    const overall_margin =
      summary.total_revenue > 0
        ? ((summary.total_profit / summary.total_revenue) * 100)
        : 0;

    // Cost per bagel includes per-bagel ingredients + amortized fixed costs
    const fixedPerBagel = grandTotalBagels > 0 ? totalFixedCosts / grandTotalBagels : 0;
    const costPerBagel = costPerBagelFromIngredients + fixedPerBagel;

    return NextResponse.json({
      daily: dailyFinancials,
      summary: {
        ...summary,
        avg_order_value,
        overall_margin,
      },
      cost_per_bagel: costPerBagel,
    });
  } catch (error) {
    console.error('Error fetching financials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
