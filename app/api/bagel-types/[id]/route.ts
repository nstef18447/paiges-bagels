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
    if (body.active !== undefined) updateData.active = body.active;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.calories !== undefined) updateData.calories = body.calories ?? null;
    if (body.protein_g !== undefined) updateData.protein_g = body.protein_g ?? null;
    if (body.carbs_g !== undefined) updateData.carbs_g = body.carbs_g ?? null;
    if (body.fat_g !== undefined) updateData.fat_g = body.fat_g ?? null;

    const { data: bagelType, error } = await supabase
      .from('bagel_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A bagel type with this name already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update bagel type' },
        { status: 500 }
      );
    }

    return NextResponse.json(bagelType);
  } catch (error) {
    console.error('Error updating bagel type:', error);
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

    // Instead of deleting, we'll deactivate the bagel type
    // This preserves historical order data
    const { error } = await supabase
      .from('bagel_types')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete bagel type' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bagel type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
