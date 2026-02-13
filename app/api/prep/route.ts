import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch all non-fake orders with their time slots and order items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total_bagels,
        status,
        is_fake,
        customer_name,
        total_price,
        time_slot_id,
        time_slots(id, date, time, is_hangover),
        order_items(quantity, bagel_types(name)),
        order_add_ons(quantity, add_on_types(name))
      `)
      .eq('is_fake', false)
      .in('status', ['pending', 'confirmed', 'ready']);

    if (ordersError) {
      console.error('Supabase error:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      );
    }

    // Group by date → slot → bagel type + add-ons
    const dateMap: Record<string, Record<string, {
      time: string;
      is_hangover: boolean;
      bagels: Record<string, number>;
      total_bagels: number;
      add_ons: Record<string, number>;
      orders: {
        customer_name: string;
        total_price: number;
        bagels: { name: string; quantity: number }[];
        add_ons: { name: string; quantity: number }[];
        total_bagels: number;
      }[];
    }>> = {};

    for (const order of orders || []) {
      const timeSlot = order.time_slots as unknown as {
        id: string;
        date: string;
        time: string;
        is_hangover: boolean;
      } | null;
      if (!timeSlot) continue;

      const { date, id: slotId, time, is_hangover } = timeSlot;

      // Apply date filters
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;

      if (!dateMap[date]) dateMap[date] = {};
      if (!dateMap[date][slotId]) {
        dateMap[date][slotId] = { time, is_hangover, bagels: {}, total_bagels: 0, add_ons: {}, orders: [] };
      }

      const slot = dateMap[date][slotId];
      const items = order.order_items as unknown as {
        quantity: number;
        bagel_types: { name: string };
      }[];

      for (const item of items || []) {
        const name = item.bagel_types?.name || 'Unknown';
        slot.bagels[name] = (slot.bagels[name] || 0) + item.quantity;
        slot.total_bagels += item.quantity;
      }

      const addOns = order.order_add_ons as unknown as {
        quantity: number;
        add_on_types: { name: string };
      }[];

      for (const addOn of addOns || []) {
        const name = addOn.add_on_types?.name || 'Unknown';
        slot.add_ons[name] = (slot.add_ons[name] || 0) + addOn.quantity;
      }

      // Collect individual confirmed/ready orders for bag packing
      if (order.status === 'confirmed' || order.status === 'ready') {
        const orderBagels = (items || []).map((item) => ({
          name: item.bagel_types?.name || 'Unknown',
          quantity: item.quantity,
        }));
        const orderAddOns = (addOns || []).map((addOn) => ({
          name: addOn.add_on_types?.name || 'Unknown',
          quantity: addOn.quantity,
        }));
        slot.orders.push({
          customer_name: (order as any).customer_name || 'Unknown',
          total_price: (order as any).total_price || 0,
          bagels: orderBagels.sort((a, b) => a.name.localeCompare(b.name)),
          add_ons: orderAddOns.sort((a, b) => a.name.localeCompare(b.name)),
          total_bagels: order.total_bagels || orderBagels.reduce((sum, b) => sum + b.quantity, 0),
        });
      }
    }

    // Convert to sorted array structure
    const days = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b)) // chronological
      .map(([date, slots]) => {
        const slotArray = Object.entries(slots)
          .sort(([, a], [, b]) => a.time.localeCompare(b.time))
          .map(([slotId, slot]) => ({
            id: slotId,
            time: slot.time,
            is_hangover: slot.is_hangover,
            bagels: Object.entries(slot.bagels)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([name, quantity]) => ({ name, quantity })),
            add_ons: Object.entries(slot.add_ons)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([name, quantity]) => ({ name, quantity })),
            total_bagels: slot.total_bagels,
            orders: slot.orders.sort((a, b) => a.customer_name.localeCompare(b.customer_name)),
          }));

        const total_bagels = slotArray.reduce((sum, s) => sum + s.total_bagels, 0);

        return { date, slots: slotArray, total_bagels };
      });

    return NextResponse.json({ days });
  } catch (error) {
    console.error('Error fetching prep data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
