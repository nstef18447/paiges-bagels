import { NextResponse } from 'next/server';

// Stripe webhook no longer used — merch checkout is Venmo-based
export async function POST() {
  return NextResponse.json({ received: true });
}
