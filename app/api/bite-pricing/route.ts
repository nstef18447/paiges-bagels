import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bite_pricing')
      .select('*')
      .order('pack_size', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bite pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bite pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();
    const supa = getServiceSupabase();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Expected an array of updates' },
        { status: 400 }
      );
    }

    for (const item of updates) {
      const updateData: Record<string, unknown> = {};
      if (item.price !== undefined) updateData.price = item.price;
      if (item.active !== undefined) updateData.active = item.active;

      const { error } = await supa
        .from('bite_pricing')
        .update(updateData)
        .eq('id', item.id);

      if (error) {
        console.error('Error updating bite pricing:', error);
        return NextResponse.json(
          { error: `Failed to update pricing for pack size` },
          { status: 500 }
        );
      }
    }

    // Return updated pricing
    const { data } = await supa
      .from('bite_pricing')
      .select('*')
      .order('pack_size', { ascending: true });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating bite pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
