import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendMerchConfirmationEmail } from '@/lib/email';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serviceSupabase = getServiceSupabase();

  const { data, error } = await serviceSupabase
    .from('merch_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const serviceSupabase = getServiceSupabase();

  const { data, error } = await serviceSupabase
    .from('merch_orders')
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.status === 'paid') {
    try {
      await sendMerchConfirmationEmail(data);
    } catch (emailError) {
      console.error('Failed to send merch confirmation email:', emailError);
    }
  }

  return NextResponse.json(data);
}
