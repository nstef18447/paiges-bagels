import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceSupabase();

    const updateData: any = {};
    if (body.date !== undefined) updateData.date = body.date;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.cutoff_time !== undefined) updateData.cutoff_time = body.cutoff_time;

    const { data: slot, error } = await supabase
      .from('time_slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update time slot' },
        { status: 500 }
      );
    }

    return NextResponse.json(slot);
  } catch (error) {
    console.error('Error updating time slot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    // Check if there are any orders for this slot
    const { data: orders, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('time_slot_id', id)
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        { error: 'Failed to check for existing orders' },
        { status: 500 }
      );
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete time slot with existing orders' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete time slot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
