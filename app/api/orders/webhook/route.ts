import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { sendConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_ORDERS_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const serviceSupabase = getServiceSupabase();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      // Update order to confirmed
      const { data: order } = await serviceSupabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('*')
        .single();

      // Send confirmation email
      if (order) {
        const { data: timeSlot } = await serviceSupabase
          .from('time_slots')
          .select('*')
          .eq('id', order.time_slot_id)
          .single();

        if (timeSlot) {
          try {
            await sendConfirmationEmail(order, timeSlot);
          } catch (emailError) {
            console.error('Failed to send bagel confirmation email:', emailError);
          }
        }
      }
    }
  }

  // checkout.session.expired: no-op, order stays pending

  return NextResponse.json({ received: true });
}
