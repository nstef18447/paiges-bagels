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
    if (body.price !== undefined) updateData.price = body.price;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;

    const { data: addOnType, error } = await supabase
      .from('add_on_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An add-on type with this name already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update add-on type' },
        { status: 500 }
      );
    }

    return NextResponse.json(addOnType);
  } catch (error) {
    console.error('Error updating add-on type:', error);
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

    // Soft-delete: deactivate to preserve historical order data
    const { error } = await supabase
      .from('add_on_types')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete add-on type' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting add-on type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
