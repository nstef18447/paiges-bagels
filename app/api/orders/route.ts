import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OrderFormData } from '@/types';
import { calculateTotal, isValidTotal, generateVenmoNote } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData: OrderFormData = await request.json();

    const total = calculateTotal(formData.bagelCounts);

    // Validate total bagels
    if (!isValidTotal(total)) {
      return NextResponse.json(
        { error: 'Total bagels must be 1, 3, or 6' },
        { status: 400 }
      );
    }

    // Check remaining capacity
    const { data: capacityData, error: capacityError } = await supabase.rpc(
      'get_slot_capacity',
      { slot_id: formData.timeSlotId }
    );

    if (capacityError) {
      return NextResponse.json(
        { error: 'Failed to check capacity' },
        { status: 500 }
      );
    }

    if (capacityData.remaining < total) {
      return NextResponse.json(
        { error: 'Not enough capacity remaining for this time slot' },
        { status: 400 }
      );
    }

    // Fetch pricing from database
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing')
      .select('*')
      .eq('bagel_quantity', total)
      .single();

    if (pricingError || !pricingData) {
      return NextResponse.json(
        { error: 'Failed to fetch pricing' },
        { status: 500 }
      );
    }

    // Create order
    const price = pricingData.price;
    const orderData = {
      time_slot_id: formData.timeSlotId,
      customer_name: formData.customerName,
      customer_email: formData.customerEmail,
      customer_phone: formData.customerPhone,
      plain_count: 0,
      everything_count: 0,
      sesame_count: 0,
      total_bagels: total,
      total_price: price,
      status: 'pending',
      venmo_note: '', // Will be updated after insert
    };

    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items for each bagel type
    const orderItems = Object.entries(formData.bagelCounts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([bagelTypeId, quantity]) => ({
        order_id: order.id,
        bagel_type_id: bagelTypeId,
        quantity,
      }));

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Failed to create order items:', itemsError);
        // Note: Order is already created, so we don't fail here
      }
    }

    // Update venmo_note with order ID
    const venmoNote = generateVenmoNote(order.id);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ venmo_note: venmoNote })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update venmo_note:', updateError);
    }

    // Fetch time slot info for response
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', formData.timeSlotId)
      .single();

    return NextResponse.json({
      order: { ...order, venmo_note: venmoNote },
      timeSlot,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
