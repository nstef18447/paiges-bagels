import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('merch_items')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const serviceSupabase = getServiceSupabase();

  const { data, error } = await serviceSupabase
    .from('merch_items')
    .insert({
      name: body.name,
      description: body.description || null,
      price: body.price,
      stock: body.stock ?? null,
      image_url: body.image_url || null,
      needs_size: body.needs_size || false,
      sizes: body.sizes || [],
      active: body.active ?? true,
      display_order: body.display_order || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
