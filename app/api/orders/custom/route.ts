import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { date, totalBagels, totalPrice, customerName } = await request.json();

    if (!date || !totalBagels || totalPrice == null) {
      return NextResponse.json(
        { error: 'Date, total bagels, and total price are required' },
        { status: 400 }
      );
    }

    // Find or create a time slot for this date
    const { data: existingSlot } = await supabase
      .from('time_slots')
      .select('id')
      .eq('date', date)
      .limit(1)
      .single();

    let timeSlotId: string;

    if (existingSlot) {
      timeSlotId = existingSlot.id;
    } else {
      // Create a placeholder slot for this date
      const { data: newSlot, error: slotError } = await supabase
        .from('time_slots')
        .insert({
          date,
          time: '12:00',
          capacity: 999,
        })
        .select('id')
        .single();

      if (slotError || !newSlot) {
        return NextResponse.json(
          { error: 'Failed to create time slot' },
          { status: 500 }
        );
      }
      timeSlotId = newSlot.id;
    }

    // Insert the custom order directly — skip RPC/capacity checks
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        time_slot_id: timeSlotId,
        customer_name: customerName || 'Corporate Order',
        customer_email: 'custom@paigesbagels.com',
        customer_phone: '',
        total_bagels: totalBagels,
        total_price: totalPrice,
        status: 'confirmed',
        venmo_note: 'Custom order',
      })
      .select('*')
      .single();

    if (orderError) {
      console.error('Failed to create custom order:', orderError);
      return NextResponse.json(
        { error: `Failed to create order: ${orderError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error creating custom order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
