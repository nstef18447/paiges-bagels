import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: slots, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch time slots' },
        { status: 500 }
      );
    }

    // Get capacity for each slot
    const slotsWithCapacity = await Promise.all(
      slots.map(async (slot) => {
        const { data: capacityData } = await supabase.rpc('get_slot_capacity', {
          slot_id: slot.id,
        });
        // RPC returns an array, get the first result
        const result = Array.isArray(capacityData) ? capacityData[0] : capacityData;
        return {
          ...slot,
          remaining: result?.remaining ?? slot.capacity,
        };
      })
    );

    return NextResponse.json(slotsWithCapacity);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, time, capacity, cutoff_time } = await request.json();

    if (!date || !time || !capacity) {
      return NextResponse.json(
        { error: 'date, time, and capacity are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: slot, error } = await supabase
      .from('time_slots')
      .insert({ date, time, capacity, cutoff_time })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create time slot' },
        { status: 500 }
      );
    }

    return NextResponse.json(slot);
  } catch (error) {
    console.error('Error creating slot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
