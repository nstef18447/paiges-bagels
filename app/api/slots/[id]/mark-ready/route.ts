import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendReadyEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    // Find all confirmed, non-fake orders for this time slot
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('time_slot_id', id)
      .eq('status', 'confirmed')
      .eq('is_fake', false);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Update all matching orders to ready
    const orderIds = orders.map((o) => o.id);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .in('id', orderIds);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update orders', details: updateError.message },
        { status: 500 }
      );
    }

    // Fetch time slot details once for emails
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', id)
      .single();

    // Send pickup email to each customer
    if (timeSlot) {
      for (const order of orders) {
        try {
          await sendReadyEmail({ ...order, status: 'ready' }, timeSlot);
        } catch (emailError) {
          console.error(`Failed to send ready email for order ${order.id}:`, emailError);
        }
      }
    }

    return NextResponse.json({ success: true, count: orders.length });
  } catch (error) {
    console.error('Error batch marking orders ready:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
