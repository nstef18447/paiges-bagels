import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendWinbackEmail } from '@/lib/email';

// Runs weekly. Targets customers whose last order slot was 4–5 weeks ago so
// each customer receives exactly one email when they first cross the threshold.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === 'true';
  const testEmail = request.nextUrl.searchParams.get('test_email');

  const supabase = getServiceSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(today.getDate() - 28);
  const fiveWeeksAgo = new Date(today);
  fiveWeeksAgo.setDate(today.getDate() - 35);

  // Find the next open slot with remaining capacity
  const todayStr = today.toISOString().split('T')[0];
  const { data: upcomingSlots } = await supabase
    .from('time_slots')
    .select('id, date, time, capacity')
    .gte('date', todayStr)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (!upcomingSlots || upcomingSlots.length === 0) {
    return NextResponse.json({ skipped: 'No upcoming slots available' });
  }

  // Check capacity for each slot
  const { data: upcomingOrders } = await supabase
    .from('orders')
    .select('time_slot_id, total_bagels')
    .in('time_slot_id', upcomingSlots.map((s) => s.id))
    .eq('is_fake', false);

  const slotUsage = new Map<string, number>();
  for (const o of upcomingOrders ?? []) {
    slotUsage.set(o.time_slot_id, (slotUsage.get(o.time_slot_id) ?? 0) + o.total_bagels);
  }

  const nextOpenSlot = upcomingSlots.find(
    (s) => (slotUsage.get(s.id) ?? 0) < s.capacity
  );

  if (!nextOpenSlot) {
    return NextResponse.json({ skipped: 'No slots with remaining capacity' });
  }

  // Find customers whose last completed order slot was 4–5 weeks ago
  const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];
  const fiveWeeksAgoStr = fiveWeeksAgo.toISOString().split('T')[0];

  const { data: recentOrders, error } = await supabase
    .from('orders')
    .select('customer_name, customer_email, time_slot:time_slots!inner(date)')
    .gte('time_slots.date', fiveWeeksAgoStr)
    .lte('time_slots.date', fourWeeksAgoStr)
    .eq('status', 'ready')
    .eq('is_fake', false);

  if (error) {
    console.error('Winback cron query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get the most recent slot date per customer in that window
  type SlottedOrder = { customer_name: string; customer_email: string; time_slot: { date: string } };
  const byEmail = new Map<string, SlottedOrder>();
  for (const o of (recentOrders ?? []) as unknown as SlottedOrder[]) {
    const email = o.customer_email.toLowerCase();
    const existing = byEmail.get(email);
    if (!existing || o.time_slot.date > existing.time_slot.date) {
      byEmail.set(email, o);
    }
  }

  if (byEmail.size === 0) {
    return NextResponse.json({ sent: 0, skipped: 'No customers in lapsed window' });
  }

  // Exclude anyone who already has a future pending/confirmed order
  const lapsedEmails = Array.from(byEmail.keys());
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('customer_email, time_slot:time_slots!inner(date)')
    .in('customer_email', lapsedEmails)
    .in('status', ['pending', 'confirmed'])
    .gte('time_slots.date', todayStr);

  const hasActiveOrder = new Set(
    ((activeOrders ?? []) as unknown as { customer_email: string }[]).map((o) =>
      o.customer_email.toLowerCase()
    )
  );

  const targets = Array.from(byEmail.values()).filter(
    (o) => !hasActiveOrder.has(o.customer_email.toLowerCase())
  );

  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      next_slot: { date: nextOpenSlot.date, time: nextOpenSlot.time },
      would_send: targets.length,
      customers: targets.map((o) => ({ name: o.customer_name, email: o.customer_email })),
    });
  }

  if (testEmail) {
    const sample = targets[0];
    if (!sample) {
      return NextResponse.json({ error: 'No eligible customers to use as sample' }, { status: 404 });
    }
    await sendWinbackEmail(sample.customer_name, testEmail, nextOpenSlot);
    return NextResponse.json({ test_sent_to: testEmail, sample_customer: sample.customer_name });
  }

  const errors: string[] = [];
  for (const o of targets) {
    try {
      await sendWinbackEmail(o.customer_name, o.customer_email, nextOpenSlot);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to send winback to ${o.customer_email}:`, msg);
      errors.push(`${o.customer_email}: ${msg}`);
    }
  }

  return NextResponse.json({
    sent: targets.length - errors.length,
    errors,
    next_slot: { date: nextOpenSlot.date, time: nextOpenSlot.time },
    customers: targets.map((o) => ({ name: o.customer_name, email: o.customer_email })),
  });
}
