import { Resend } from 'resend';
import { Order, OrderWithDetails, TimeSlot } from '@/types';
import { formatDate, formatTime } from './utils';
import { supabase } from './supabase';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendConfirmationEmail(
  order: Order,
  timeSlot: TimeSlot
): Promise<void> {
  // Fetch order items
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, bagel_type:bagel_types(*)')
    .eq('order_id', order.id);

  // Build bagel list from order_items if available, otherwise use old columns
  const bagelList = orderItems && orderItems.length > 0
    ? orderItems.map(item => `${item.quantity} ${item.bagel_type.name} bagels`)
    : [
        order.plain_count > 0 && `${order.plain_count} Plain bagels`,
        order.everything_count > 0 && `${order.everything_count} Everything bagels`,
        order.sesame_count > 0 && `${order.sesame_count} Sesame bagels`,
      ].filter(Boolean);

  // Fetch order add-ons
  const { data: orderAddOns } = await supabase
    .from('order_add_ons')
    .select('*, add_on_type:add_on_types(*)')
    .eq('order_id', order.id);

  const addOnList = orderAddOns && orderAddOns.length > 0
    ? orderAddOns.map(item => `${item.quantity} ${item.add_on_type.name}`)
    : [];

  const addOnsHtml = addOnList.length > 0
    ? `
    <p style="margin:0 0 4px 0;"><strong>Add-Ons:</strong></p>
    <ul style="margin:0; padding-left:20px;">
      ${addOnList.map(item => `<li>${item}</li>`).join('\n')}
    </ul>`
    : '';

  const emailHtml = `
    <h1>Your Paige's Bagels Order is Confirmed! 🥯</h1>
    <p>Hi ${order.customer_name},</p>
    <p>Thanks for your order! Your bagels will be ready for pickup on:</p>
    <p><strong>📅 ${formatDate(timeSlot.date)} at ${formatTime(timeSlot.time)}</strong></p>
    <p><strong>📍 Pickup Location: E2 1510W</strong></p>
    <p style="margin:0 0 4px 0;"><strong>Your order:</strong></p>
    <ul style="margin:0; padding-left:20px;">
      ${bagelList.map(item => `<li>${item}</li>`).join('\n')}
    </ul>
    ${addOnsHtml}
    <p><strong>Total: $${order.total_price.toFixed(2)}</strong></p>
    <p>See you soon!</p>
    <p>Paige's Bagels</p>
  `;

  await resend.emails.send({
    from: 'Paige\'s Bagels <orders@paigesbagels.com>',
    to: order.customer_email,
    subject: 'Your Paige\'s Bagels Order is Confirmed! 🥯',
    html: emailHtml,
  });
}

export async function sendReadyEmail(
  order: Order,
  timeSlot: TimeSlot
): Promise<void> {
  const emailHtml = `
    <h1>Your Bagels are Ready! 🥯</h1>
    <p>Hi ${order.customer_name},</p>
    <p>Your Paige's Bagels order is ready for pickup!</p>
    <p><strong>📅 Pickup: ${formatDate(timeSlot.date)} at ${formatTime(timeSlot.time)}</strong></p>
    <p><strong>📍 Location: E2 1510W</strong></p>
    <p>See you soon!</p>
    <p>Paige's Bagels</p>
  `;

  await resend.emails.send({
    from: 'Paige\'s Bagels <orders@paigesbagels.com>',
    to: order.customer_email,
    subject: 'Your Bagels are Ready! 🥯',
    html: emailHtml,
  });
}
