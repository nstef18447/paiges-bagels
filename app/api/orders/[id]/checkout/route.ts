import { NextResponse } from 'next/server';

// Stripe checkout no longer used
export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 });
}
