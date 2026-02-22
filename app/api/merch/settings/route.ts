import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('merch_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const serviceSupabase = getServiceSupabase();

  // Update the single settings row
  const { data, error } = await serviceSupabase
    .from('merch_settings')
    .update({
      shipping_cost: body.shipping_cost,
      updated_at: new Date().toISOString(),
    })
    .not('id', 'is', null) // update the one row
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
