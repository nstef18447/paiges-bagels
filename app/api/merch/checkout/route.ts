import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

interface CartItem {
  id: string;
  quantity: number;
  size?: string;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, customerName, customerEmail, shippingAddress, shippingCity, shippingState, shippingZip } = body as {
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingZip: string;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
  }

  if (!customerName || !customerEmail || !shippingAddress || !shippingCity || !shippingState || !shippingZip) {
    return NextResponse.json({ error: 'Missing shipping information' }, { status: 400 });
  }

  const serviceSupabase = getServiceSupabase();

  // Fetch all merch items from DB to validate prices
  const itemIds = items.map(i => i.id);
  const { data: merchItems, error: itemsError } = await serviceSupabase
    .from('merch_items')
    .select('*')
    .in('id', itemIds)
    .eq('active', true);

  if (itemsError || !merchItems) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }

  const itemMap = new Map(merchItems.map(i => [i.id, i]));

  // Validate all items exist and check stock
  const orderItems = [];
  for (const cartItem of items) {
    const dbItem = itemMap.get(cartItem.id);
    if (!dbItem) {
      return NextResponse.json({ error: `Item not found: ${cartItem.id}` }, { status: 400 });
    }
    if (dbItem.stock !== null && dbItem.stock < cartItem.quantity) {
      return NextResponse.json({ error: `Not enough stock for ${dbItem.name}` }, { status: 400 });
    }
    orderItems.push({
      id: dbItem.id,
      name: dbItem.name,
      size: cartItem.size || null,
      quantity: cartItem.quantity,
      unit_price: dbItem.price,
    });
  }

  // Fetch shipping cost
  const { data: settings } = await serviceSupabase
    .from('merch_settings')
    .select('shipping_cost')
    .limit(1)
    .single();

  const shippingCost = settings?.shipping_cost ?? 5.00;

  // Calculate total from DB prices (not client-sent prices)
  const itemsTotal = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalPrice = itemsTotal + shippingCost;

  // Decrement stock for items with limited stock
  for (const cartItem of items) {
    const dbItem = itemMap.get(cartItem.id)!;
    if (dbItem.stock !== null) {
      const { error: stockError } = await serviceSupabase
        .from('merch_items')
        .update({
          stock: dbItem.stock - cartItem.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbItem.id);

      if (stockError) {
        return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
      }
    }
  }

  // Insert order as pending_payment
  const { data: order, error: orderError } = await serviceSupabase
    .from('merch_orders')
    .insert({
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_state: shippingState,
      shipping_zip: shippingZip,
      items: orderItems,
      shipping_cost: shippingCost,
      total_price: totalPrice,
      status: 'pending_payment',
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  // Create Stripe Checkout Session
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderItems.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.size ? `${item.name} (${item.size})` : item.name,
      },
      unit_amount: Math.round(item.unit_price * 100),
    },
    quantity: item.quantity,
  }));

  // Add shipping as a line item
  lineItems.push({
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Shipping',
      },
      unit_amount: Math.round(shippingCost * 100),
    },
    quantity: 1,
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      metadata: {
        order_id: order.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/merch/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/merch`,
    });

    // Update order with stripe session ID
    await serviceSupabase
      .from('merch_orders')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (stripeError: unknown) {
    const message = stripeError instanceof Error ? stripeError.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
