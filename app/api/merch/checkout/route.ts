import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateVenmoNote } from '@/lib/utils';

interface CartItem {
  id: string;
  quantity: number;
  size?: string;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, customerName, customerEmail, customerPhone } = body as {
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
  }

  if (!customerName || !customerEmail) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const serviceSupabase = getServiceSupabase();

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
      is_preorder: dbItem.is_preorder ?? false,
    });
  }

  const { data: settings } = await serviceSupabase
    .from('merch_settings')
    .select('shipping_cost')
    .limit(1)
    .single();

  const pickupFee = settings?.shipping_cost ?? 5.00;
  const itemsTotal = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalPrice = itemsTotal + pickupFee;

  for (const cartItem of items) {
    const dbItem = itemMap.get(cartItem.id)!;
    if (dbItem.stock !== null) {
      await serviceSupabase
        .from('merch_items')
        .update({ stock: dbItem.stock - cartItem.quantity, updated_at: new Date().toISOString() })
        .eq('id', dbItem.id);
    }
  }

  const { data: order, error: orderError } = await serviceSupabase
    .from('merch_orders')
    .insert({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      shipping_address: '',
      shipping_city: '',
      shipping_state: '',
      shipping_zip: '',
      items: orderItems,
      shipping_cost: pickupFee,
      total_price: totalPrice,
      status: 'pending_payment',
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  const venmoNote = generateVenmoNote(order.id);

  return NextResponse.json({ orderId: order.id, venmoNote, totalPrice });
}
