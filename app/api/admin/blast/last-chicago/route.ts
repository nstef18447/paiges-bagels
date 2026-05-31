import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendLastChicagoEmail } from '@/lib/email';

// One-time blast: everyone who hasn't ordered in 30+ days gets a "last Chicago" email.
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
  const todayStr = today.toISOString().split('T')[0];

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Upcoming slots with remaining capacity
  const { data: upcomingSlots } = await supabase
    .from('time_slots')
    .select('id, date, time, capacity')
    .gte('date', todayStr)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (!upcomingSlots || upcomingSlots.length === 0) {
    return NextResponse.json({ skipped: 'No upcoming slots' });
  }

  const { data: slotOrders } = await supabase
    .from('orders')
    .select('time_slot_id, total_bagels')
    .in('time_slot_id', upcomingSlots.map((s) => s.id))
    .eq('is_fake', false);

  const slotUsage = new Map<string, number>();
  for (const o of slotOrders ?? []) {
    slotUsage.set(o.time_slot_id, (slotUsage.get(o.time_slot_id) ?? 0) + o.total_bagels);
  }

  // Deduplicate identical date+time pairs, keep all slots across all dates
  const seenSlots = new Set<string>();
  const allSlotDates: { date: string; time: string }[] = [];
  let anyCapacityLeft = false;
  for (const s of upcomingSlots) {
    if ((slotUsage.get(s.id) ?? 0) < s.capacity) anyCapacityLeft = true;
    const key = `${s.date}-${s.time}`;
    if (!seenSlots.has(key)) {
      seenSlots.add(key);
      allSlotDates.push({ date: s.date, time: s.time });
    }
  }

  if (!anyCapacityLeft) {
    return NextResponse.json({ skipped: 'No slots with remaining capacity' });
  }

  // All customers — find the most recent completed order per person
  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('customer_name, customer_email, time_slot:time_slots!inner(date)')
    .eq('status', 'ready')
    .eq('is_fake', false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type SlottedOrder = { customer_name: string; customer_email: string; time_slot: { date: string } };
  const lastOrderByEmail = new Map<string, SlottedOrder>();
  for (const o of (allOrders ?? []) as unknown as SlottedOrder[]) {
    const email = o.customer_email.toLowerCase();
    const existing = lastOrderByEmail.get(email);
    if (!existing || o.time_slot.date > existing.time_slot.date) {
      lastOrderByEmail.set(email, o);
    }
  }

  // Only people whose last order was within 30 days (the ones missed by the original blast)
  const lapsed = Array.from(lastOrderByEmail.values()).filter(
    (o) => o.time_slot.date > thirtyDaysAgoStr
  );

  const targets = [...lapsed];

  // Remove internal/fake addresses, obvious email typos, and Paige's own email
  const EXCLUDE = new Set(['custom@paigesbagels.com', 'paigeetuchner@me.com']);
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && !e.endsWith('.con');
  const filtered = targets.filter(
    (t) => !EXCLUDE.has(t.customer_email.toLowerCase()) && validEmail(t.customer_email)
  );

  // Exclude anyone with an active upcoming order
  const allTargetEmails = filtered.map((t) => t.customer_email.toLowerCase());
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('customer_email, time_slot:time_slots!inner(date)')
    .in('customer_email', allTargetEmails)
    .in('status', ['pending', 'confirmed'])
    .gte('time_slots.date', todayStr);

  const hasActiveOrder = new Set(
    ((activeOrders ?? []) as unknown as { customer_email: string }[]).map((o) =>
      o.customer_email.toLowerCase()
    )
  );

  const finalTargets = filtered.filter((t) => !hasActiveOrder.has(t.customer_email.toLowerCase()));

  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      slots: allSlotDates,
      would_send: finalTargets.length,
      customers: finalTargets.map((t) => ({ name: t.customer_name, email: t.customer_email })),
    });
  }

  if (testEmail) {
    const sample = finalTargets[0];
    if (!sample) {
      return NextResponse.json({ error: 'No eligible customers for sample' }, { status: 404 });
    }
    await sendLastChicagoEmail(sample.customer_name, testEmail, allSlotDates);
    return NextResponse.json({ test_sent_to: testEmail, sample_customer: sample.customer_name });
  }

  const errors: string[] = [];
  for (const t of finalTargets) {
    try {
      await sendLastChicagoEmail(t.customer_name, t.customer_email, allSlotDates);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to send to ${t.customer_email}:`, msg);
      errors.push(`${t.customer_email}: ${msg}`);
    }
  }

  // Tag everyone who was emailed as chicago in subscribers
  const sentTargets = finalTargets.filter((t) => !errors.some((e) => e.startsWith(t.customer_email)));
  await supabase.from('subscribers').upsert(
    sentTargets.map((t) => ({
      email: t.customer_email.toLowerCase(),
      customer_name: t.customer_name,
      source: 'order',
      market: 'chicago',
    })),
    { onConflict: 'email' }
  );

  return NextResponse.json({
    sent: finalTargets.length - errors.length,
    errors,
    slots: allSlotDates,
    customers: finalTargets.map((t) => ({ name: t.customer_name, email: t.customer_email })),
  });
}
