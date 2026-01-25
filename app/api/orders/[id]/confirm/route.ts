import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendConfirmationEmail } from '@/lib/email';

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
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to confirm order' },
        { status: 500 }
      );
    }

    // Get time slot info
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', order.time_slot_id)
      .single();

    // Send confirmation email
    if (timeSlot) {
      await sendConfirmationEmail(order, timeSlot);
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error confirming order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
