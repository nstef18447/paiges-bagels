import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slot_id');

    if (!slotId) {
      return NextResponse.json(
        { error: 'slot_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('get_slot_capacity', {
      slot_id: slotId,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch capacity' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching capacity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
