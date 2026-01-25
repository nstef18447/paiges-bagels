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

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to mark order ready' },
        { status: 500 }
      );
    }

    // Get time slot info
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', order.time_slot_id)
      .single();

    // Send ready email
    if (timeSlot) {
      await sendReadyEmail(order, timeSlot);
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error marking order ready:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
