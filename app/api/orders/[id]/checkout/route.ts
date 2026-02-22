import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const CC_FEE_RATE = 0.03;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const serviceSupabase = getServiceSupabase();

  // Fetch order from DB
  const { data: order, error: orderError } = await serviceSupabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Order is already confirmed' }, { status: 400 });
  }

  const subtotal = order.total_price;
  const ccFee = Math.round(subtotal * CC_FEE_RATE * 100) / 100;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Bagel Order',
        },
        unit_amount: Math.round(subtotal * 100),
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Credit Card Fee (3%)',
        },
        unit_amount: Math.round(ccFee * 100),
      },
      quantity: 1,
    },
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: order.customer_email,
      metadata: {
        order_id: order.id,
      },
      success_url: `${siteUrl}/confirmation?orderId=${orderId}&paid=true`,
      cancel_url: `${siteUrl}/confirmation?orderId=${orderId}`,
    });

    // Store stripe session ID on the order
    await serviceSupabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return NextResponse.json({ url: session.url });
  } catch (stripeError: unknown) {
    const message = stripeError instanceof Error ? stripeError.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
