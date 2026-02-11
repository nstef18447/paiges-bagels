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
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bagel types', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(bagelTypes);
  } catch (error) {
    console.error('Error fetching bagel types:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, display_order, image_url, description, calories, protein_g, carbs_g, fat_g } = await request.json();

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
        image_url: image_url || null,
        description: description || null,
        calories: calories ?? null,
        protein_g: protein_g ?? null,
        carbs_g: carbs_g ?? null,
        fat_g: fat_g ?? null,
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
