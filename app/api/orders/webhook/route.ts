import { NextResponse } from 'next/server';

// Stripe webhook no longer used — orders use Venmo payment flow
export async function POST() {
  return NextResponse.json({ received: true });
}
