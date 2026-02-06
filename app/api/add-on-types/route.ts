import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: addOnTypes, error } = await supabase
      .from('add_on_types')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch add-on types', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(addOnTypes);
  } catch (error) {
    console.error('Error fetching add-on types:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, price, display_order } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (price === undefined || price < 0) {
      return NextResponse.json(
        { error: 'A valid price is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: addOnType, error } = await supabase
      .from('add_on_types')
      .insert({
        name,
        price,
        display_order: display_order || 0,
        active: true,
      })
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
        { error: 'Failed to create add-on type' },
        { status: 500 }
      );
    }

    return NextResponse.json(addOnType);
  } catch (error) {
    console.error('Error creating add-on type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
