import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OrderFormData } from '@/types';
import { calculateTotal, isValidTotal, calculateBundlePrice, generateVenmoNote } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData: OrderFormData = await request.json();

    const total = calculateTotal(formData.bagelCounts);

    // Validate total bagels
    if (!isValidTotal(total)) {
      return NextResponse.json(
        { error: 'Total bagels must be between 1 and 6' },
        { status: 400 }
      );
    }

    // Determine pricing type from the time slot
    const { data: slotData, error: slotError } = await supabase
      .from('time_slots')
      .select('is_hangover')
      .eq('id', formData.timeSlotId)
      .single();

    if (slotError || !slotData) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    const pricingType = slotData.is_hangover ? 'hangover' : 'regular';

    // Fetch pricing tiers for the correct type
    const { data: pricingTiers, error: pricingError } = await supabase
      .from('pricing')
      .select('*')
      .eq('pricing_type', pricingType);

    if (pricingError || !pricingTiers || pricingTiers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch pricing' },
        { status: 500 }
      );
    }

    // Calculate add-on total
    let addOnTotal = 0;
    const addOnCounts = formData.addOnCounts || {};
    const addOnEntries = Object.entries(addOnCounts).filter(([_, qty]) => qty > 0);

    if (addOnEntries.length > 0) {
      const addOnTypeIds = addOnEntries.map(([id]) => id);
      const { data: addOnTypes, error: addOnError } = await supabase
        .from('add_on_types')
        .select('id, price')
        .in('id', addOnTypeIds);

      if (addOnError) {
        return NextResponse.json(
          { error: 'Failed to fetch add-on prices' },
          { status: 500 }
        );
      }

      const addOnPriceMap = new Map(addOnTypes.map((t: { id: string; price: number }) => [t.id, t.price]));
      for (const [addOnTypeId, quantity] of addOnEntries) {
        const unitPrice = addOnPriceMap.get(addOnTypeId) || 0;
        addOnTotal += quantity * unitPrice;
      }
    }

    // Calculate price
    const price = calculateBundlePrice(total, pricingTiers) + addOnTotal;

    // Atomic order creation — locks the slot, checks capacity, and inserts in one transaction
    const { data: orderId, error: insertError } = await supabase.rpc(
      'create_order_atomic',
      {
        p_time_slot_id: formData.timeSlotId,
        p_customer_name: formData.customerName,
        p_customer_email: formData.customerEmail,
        p_customer_phone: formData.customerPhone,
        p_total_bagels: total,
        p_total_price: price,
      }
    );

    if (insertError) {
      // The RPC raises an exception if capacity is exceeded
      if (insertError.message?.includes('Not enough capacity')) {
        return NextResponse.json(
          { error: 'Not enough capacity remaining for this time slot' },
          { status: 400 }
        );
      }
      console.error('Failed to create order:', insertError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Update venmo_note with order ID
    const venmoNote = generateVenmoNote(orderId);
    await supabase
      .from('orders')
      .update({ venmo_note: venmoNote })
      .eq('id', orderId);

    // Create order items for each bagel type
    const orderItems = Object.entries(formData.bagelCounts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([bagelTypeId, quantity]) => ({
        order_id: orderId,
        bagel_type_id: bagelTypeId,
        quantity,
      }));

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Failed to create order items:', itemsError);
      }
    }

    // Create order add-ons for each add-on type
    const orderAddOns = addOnEntries.map(([addOnTypeId, quantity]) => ({
      order_id: orderId,
      add_on_type_id: addOnTypeId,
      quantity,
    }));

    if (orderAddOns.length > 0) {
      const { error: addOnsError } = await supabase
        .from('order_add_ons')
        .insert(orderAddOns);

      if (addOnsError) {
        console.error('Failed to create order add-ons:', addOnsError);
      }
    }

    // Fetch full order + time slot for response
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

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
