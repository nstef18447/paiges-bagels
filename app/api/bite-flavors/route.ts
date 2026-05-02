import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bite_flavors')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bite flavors' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bite flavors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug, sort_order } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const supa = getServiceSupabase();
    const { data, error } = await supa
      .from('bite_flavors')
      .insert({
        name,
        slug,
        sort_order: sort_order || 0,
        active: true,
      })
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
        { error: 'Failed to create bite flavor' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating bite flavor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
