import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('cost_type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, unit, cost_per_unit, units_per_bagel, cost_type, add_on_type_id } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceSupabase();

    const { data, error } = await serviceSupabase
      .from('ingredients')
      .insert({
        name,
        unit: unit || '',
        cost_per_unit: cost_per_unit || 0,
        units_per_bagel: units_per_bagel || 0,
        cost_type: cost_type || 'per_bagel',
        add_on_type_id: add_on_type_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create ingredient', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, unit, cost_per_unit, units_per_bagel, cost_type, add_on_type_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceSupabase();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (unit !== undefined) updateData.unit = unit;
    if (cost_per_unit !== undefined) updateData.cost_per_unit = cost_per_unit;
    if (units_per_bagel !== undefined) updateData.units_per_bagel = units_per_bagel;
    if (cost_type !== undefined) updateData.cost_type = cost_type;
    if (add_on_type_id !== undefined) updateData.add_on_type_id = add_on_type_id || null;

    const { data, error } = await serviceSupabase
      .from('ingredients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update ingredient', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ingredient ID is required' },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceSupabase();

    const { error } = await serviceSupabase
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete ingredient', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
