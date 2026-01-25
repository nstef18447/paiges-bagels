import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: bagelTypes, error } = await supabase
      .from('bagel_types')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bagel types' },
        { status: 500 }
      );
    }

    return NextResponse.json(bagelTypes);
  } catch (error) {
    console.error('Error fetching bagel types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, display_order } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: bagelType, error } = await supabase
      .from('bagel_types')
      .insert({
        name,
        display_order: display_order || 0,
        active: true,
      })
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
        { error: 'Failed to create bagel type' },
        { status: 500 }
      );
    }

    return NextResponse.json(bagelType);
  } catch (error) {
    console.error('Error creating bagel type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
