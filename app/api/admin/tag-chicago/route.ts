import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// One-time endpoint: upsert all past Chicago orderers into subscribers with market='chicago'.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  // Pull every unique customer from orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('customer_name, customer_email, customer_phone')
    .eq('is_fake', false)
    .eq('status', 'ready');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by email
  const byEmail = new Map<string, { customer_name: string; customer_email: string; customer_phone: string }>();
  for (const o of orders ?? []) {
    if (!byEmail.has(o.customer_email.toLowerCase())) {
      byEmail.set(o.customer_email.toLowerCase(), o);
    }
  }

  const rows = Array.from(byEmail.values()).map((o) => ({
    email: o.customer_email.toLowerCase(),
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    source: 'order',
    market: 'chicago',
  }));

  // Upsert — existing subscribers get market set, new ones get created
  const { error: upsertError } = await supabase
    .from('subscribers')
    .upsert(rows, { onConflict: 'email' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ tagged: rows.length });
}
