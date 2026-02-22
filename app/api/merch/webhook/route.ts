import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { sendMerchConfirmationEmail } from '@/lib/email';

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
      process.env.STRIPE_WEBHOOK_SECRET!
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
      // Update order to paid
      const { data: order } = await serviceSupabase
        .from('merch_orders')
        .update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      // Send confirmation email
      if (order) {
        try {
          await sendMerchConfirmationEmail(order);
        } catch (emailError) {
          console.error('Failed to send merch confirmation email:', emailError);
        }
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      // Fetch order to restore stock
      const { data: order } = await serviceSupabase
        .from('merch_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order && order.status === 'pending_payment') {
        // Restore stock for each item
        for (const item of order.items) {
          const { data: merchItem } = await serviceSupabase
            .from('merch_items')
            .select('stock')
            .eq('id', item.id)
            .single();

          if (merchItem && merchItem.stock !== null) {
            await serviceSupabase
              .from('merch_items')
              .update({
                stock: merchItem.stock + item.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);
          }
        }

        // Update order to cancelled
        await serviceSupabase
          .from('merch_orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
