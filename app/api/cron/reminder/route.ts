import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendPickupReminderEmail } from '@/lib/email';
import { formatTime } from '@/lib/utils';
import { Order, TimeSlot } from '@/types';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === 'true';
  const testEmail = request.nextUrl.searchParams.get('test_email');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const supabase = getServiceSupabase();
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, time_slot:time_slots!inner(*)')
    .eq('time_slots.date', tomorrowStr)
    .in('status', ['pending', 'confirmed'])
    .eq('is_fake', false);

  if (error) {
    console.error('Reminder cron query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const targets = (orders ?? []).map((o: Order & { time_slot: TimeSlot }) => ({
    name: o.customer_name,
    email: o.customer_email,
    pickup_time: formatTime(o.time_slot.time),
  }));

  if (dryRun) {
    return NextResponse.json({ dry_run: true, would_send: targets.length, orders: targets });
  }

  if (testEmail) {
    const sample = (orders ?? [])[0] as (Order & { time_slot: TimeSlot }) | undefined;
    if (!sample) {
      return NextResponse.json({ error: 'No orders found for tomorrow to use as sample' }, { status: 404 });
    }
    await sendPickupReminderEmail({ ...sample, customer_email: testEmail }, sample.time_slot);
    return NextResponse.json({ test_sent_to: testEmail, sample_order: sample.customer_name });
  }

  const errors: string[] = [];
  for (const order of (orders ?? []) as (Order & { time_slot: TimeSlot })[]) {
    try {
      await sendPickupReminderEmail(order, order.time_slot);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to send reminder to ${order.customer_email}:`, msg);
      errors.push(`${order.customer_email}: ${msg}`);
    }
  }

  return NextResponse.json({
    sent: targets.length - errors.length,
    errors,
    orders: targets,
  });
}
