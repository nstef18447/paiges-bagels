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

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null;

    const { data, error } = await supabase
      .from('bite_flavors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A bite flavor with this slug already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update bite flavor' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating bite flavor:', error);
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

    const { error } = await supabase
      .from('bite_flavors')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete bite flavor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bite flavor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
