import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch all confirmed/ready orders with their time slots
    let query = supabase
      .from('orders')
      .select('id, total_bagels, total_price, status, time_slot_id, time_slots(date)')
      .in('status', ['confirmed', 'ready']);

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Supabase error:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      );
    }

    // Fetch all ingredients to calculate cost per bagel
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('cost_per_unit, units_per_bagel');

    if (ingredientsError) {
      console.error('Supabase error:', ingredientsError);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients', details: ingredientsError.message },
        { status: 500 }
      );
    }

    // Calculate cost per bagel
    const costPerBagel = (ingredients || []).reduce(
      (sum, ing) => sum + Number(ing.cost_per_unit) * Number(ing.units_per_bagel),
      0
    );

    // Group orders by date
    const dailyMap: Record<string, { orders: number; bagels_sold: number; revenue: number }> = {};

    for (const order of orders || []) {
      const timeSlot = order.time_slots as unknown as { date: string } | null;
      const date = timeSlot?.date;
      if (!date) continue;

      // Apply date filters
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;

      if (!dailyMap[date]) {
        dailyMap[date] = { orders: 0, bagels_sold: 0, revenue: 0 };
      }

      dailyMap[date].orders += 1;
      dailyMap[date].bagels_sold += order.total_bagels;
      dailyMap[date].revenue += Number(order.total_price);
    }

    // Build daily financials array
    const dailyFinancials = Object.entries(dailyMap)
      .sort(([a], [b]) => b.localeCompare(a)) // newest first
      .map(([date, data]) => {
        const cogs = data.bagels_sold * costPerBagel;
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
