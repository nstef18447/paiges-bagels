import { Resend } from 'resend';
import { Order, OrderWithDetails, TimeSlot, MerchOrder } from '@/types';
import { formatDate, formatTime } from './utils';
import { supabase } from './supabase';

const resend = new Resend(process.env.RESEND_API_KEY!);

/* ── Shared email styles ── */
const BRAND = {
  blue: '#004aad',
  brown: '#7a4900',
  bg: '#f6f4f0',
  card: '#ffffff',
  border: '#e5e0db',
  textSec: '#6b7280',
  logoUrl: 'https://paigesbagels.com/logo.png',
};

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
    <tr><td align="center" style="padding:0;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td align="center" style="padding:32px 24px 24px;border-bottom:1px solid ${BRAND.border};">
          <img src="${BRAND.logoUrl}" alt="Paige's Bagels" style="max-width:200px;height:auto;" />
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:0;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.blue};">
            <tr><td align="center" style="padding:28px 24px;">
              <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#ffffff;">Paige's Bagels</p>
              <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.1em;color:rgba(255,255,255,0.5);">SERIOUSLY SOURDOUGH</p>
              <p style="margin:0;font-size:12px;">
                <a href="https://paigesbagels.com" style="color:rgba(255,255,255,0.7);text-decoration:underline;">paigesbagels.com</a>
                &nbsp;&middot;&nbsp;
                <a href="https://instagram.com/paigesbagels" style="color:rgba(255,255,255,0.7);text-decoration:underline;">@paigesbagels</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendConfirmationEmail(
  order: Order,
  timeSlot: TimeSlot
): Promise<void> {
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, bagel_type:bagel_types(*)')
    .eq('order_id', order.id);

  const bagelList = orderItems && orderItems.length > 0
    ? orderItems.map(item => `${item.quantity} ${item.bagel_type.name} bagels`)
    : [
        order.plain_count > 0 && `${order.plain_count} Plain bagels`,
        order.everything_count > 0 && `${order.everything_count} Everything bagels`,
        order.sesame_count > 0 && `${order.sesame_count} Sesame bagels`,
      ].filter(Boolean);

  const { data: orderAddOns } = await supabase
    .from('order_add_ons')
    .select('*, add_on_type:add_on_types(*)')
    .eq('order_id', order.id);

  const addOnList = orderAddOns && orderAddOns.length > 0
    ? orderAddOns.map(item => `${item.quantity} ${item.add_on_type.name}`)
    : [];

  const itemRows = bagelList.map(item => `
    <tr><td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,sans-serif;font-size:14px;color:#333;">
      ${item}
    </td></tr>`).join('');

  const addOnRows = addOnList.length > 0
    ? addOnList.map(item => `
    <tr><td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,sans-serif;font-size:14px;color:#333;">
      ${item} <span style="color:${BRAND.textSec};font-size:12px;">(on the side)</span>
    </td></tr>`).join('')
    : '';

  const content = `
    <!-- Success icon + heading -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:36px 24px 8px;">
        <div style="width:48px;height:48px;border-radius:50%;background-color:${BRAND.blue};display:inline-block;text-align:center;line-height:48px;">
          <span style="color:#fff;font-size:24px;">&#10003;</span>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:12px 24px 4px;">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:${BRAND.blue};">Order Confirmed!</h1>
      </td></tr>
      <tr><td align="center" style="padding:0 24px 28px;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:${BRAND.textSec};">Thanks for your order, ${order.customer_name}!</p>
      </td></tr>
    </table>

    <!-- Order details card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 24px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr><td style="padding:20px;">
            <!-- Order ID -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:12px;color:${BRAND.textSec};text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Order</td>
              </tr>
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#333;padding-bottom:16px;border-bottom:1px solid ${BRAND.border};">
                  #${order.id.slice(0, 8).toUpperCase()}
                </td>
              </tr>
            </table>

            <!-- Pickup -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:12px;color:${BRAND.textSec};text-transform:uppercase;letter-spacing:0.05em;padding:16px 0 4px;">Pickup</td>
              </tr>
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#333;padding-bottom:16px;border-bottom:1px solid ${BRAND.border};">
                  ${formatDate(timeSlot.date)} at ${formatTime(timeSlot.time)}
                </td>
              </tr>
            </table>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:12px;color:${BRAND.textSec};text-transform:uppercase;letter-spacing:0.05em;padding:16px 0 4px;">Items</td>
              </tr>
              ${itemRows}
              ${addOnRows}
            </table>

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 0 0;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:${BRAND.blue};">
                  Total: $${order.total_price.toFixed(2)}
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- What's next -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px 24px 36px;">
        <h3 style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;color:${BRAND.blue};">What&rsquo;s Next</h3>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 8px 8px 0;font-size:14px;vertical-align:top;">&#x2022;</td>
            <td style="padding:0 0 8px;font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">We'll have your bagels ready at <strong>${formatTime(timeSlot.time)}</strong></td>
          </tr>
          <tr>
            <td style="padding:0 8px 8px 0;font-size:14px;vertical-align:top;">&#x2022;</td>
            <td style="padding:0 0 8px;font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">Pickup at <strong>1881 Oak Avenue Apt 1510W, Evanston IL 60201</strong></td>
          </tr>
          <tr>
            <td style="padding:0 8px 0 0;font-size:14px;vertical-align:top;">&#x2022;</td>
            <td style="padding:0;font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">Bagels will be outside! Use call box if needed.</td>
          </tr>
        </table>
      </td></tr>
    </table>`;

  const emailHtml = emailWrapper(content);

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
  const content = `
    <!-- Success icon + heading -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:36px 24px 8px;">
        <div style="width:48px;height:48px;border-radius:50%;background-color:#15803d;display:inline-block;text-align:center;line-height:48px;">
          <span style="color:#fff;font-size:24px;">&#10003;</span>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:12px 24px 4px;">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:${BRAND.blue};">Your Bagels are Ready!</h1>
      </td></tr>
      <tr><td align="center" style="padding:0 24px 28px;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:${BRAND.textSec};">Hi ${order.customer_name}, come grab your bagels!</p>
      </td></tr>
    </table>

    <!-- Pickup details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 24px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr><td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:12px;color:${BRAND.textSec};text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Pickup</td>
              </tr>
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#333;padding-bottom:16px;border-bottom:1px solid ${BRAND.border};">
                  ${formatDate(timeSlot.date)} at ${formatTime(timeSlot.time)}
                </td>
              </tr>
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:12px;color:${BRAND.textSec};text-transform:uppercase;letter-spacing:0.05em;padding:16px 0 4px;">Location</td>
              </tr>
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#333;">
                  1881 Oak Avenue Apt 1510W, Evanston IL 60201
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 24px 36px;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">
          Bagels will be outside! Please use the call box to call Paige Tuchner to be let upstairs if needed.
        </p>
      </td></tr>
    </table>`;

  const emailHtml = emailWrapper(content);

  await resend.emails.send({
    from: 'Paige\'s Bagels <orders@paigesbagels.com>',
    to: order.customer_email,
    subject: 'Your Bagels are Ready! 🥯',
    html: emailHtml,
  });
}

export async function sendMerchConfirmationEmail(
  order: MerchOrder
): Promise<void> {
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,sans-serif;font-size:14px;color:#333;">
        ${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ''}
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#333;">
        $${(item.unit_price * item.quantity).toFixed(2)}
      </td>
    </tr>`).join('');

  const content = `
    <!-- Success icon + heading -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:36px 24px 8px;">
        <div style="width:48px;height:48px;border-radius:50%;background-color:${BRAND.blue};display:inline-block;text-align:center;line-height:48px;">
          <span style="color:#fff;font-size:24px;">&#10003;</span>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:12px 24px 4px;">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:${BRAND.blue};">Merch Order Confirmed!</h1>
      </td></tr>
      <tr><td align="center" style="padding:0 24px 28px;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:${BRAND.textSec};">Thanks for your order, ${order.customer_name}!</p>
      </td></tr>
    </table>

    <!-- Order details card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 24px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr><td style="padding:20px;">
            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:12px;color:${BRAND.textSec};text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;">Items</td>
                <td></td>
              </tr>
              ${itemRows}
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,sans-serif;font-size:14px;color:${BRAND.textSec};">Shipping</td>
                <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:Arial,sans-serif;font-size:14px;color:${BRAND.textSec};">$${order.shipping_cost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:14px 0 0;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:${BRAND.blue};">Total</td>
                <td align="right" style="padding:14px 0 0;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:${BRAND.blue};">$${order.total_price.toFixed(2)}</td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Shipping address -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 24px 36px;">
        <h3 style="margin:0 0 8px;font-family:Georgia,serif;font-size:16px;color:${BRAND.blue};">Shipping To</h3>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.5;">
          ${order.shipping_address}<br/>
          ${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}
        </p>
        <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:14px;color:${BRAND.textSec};">We'll ship your merch soon!</p>
      </td></tr>
    </table>`;

  const emailHtml = emailWrapper(content);

  await resend.emails.send({
    from: 'Paige\'s Bagels <orders@paigesbagels.com>',
    to: order.customer_email,
    subject: 'Your Merch Order is Confirmed! 🎉',
    html: emailHtml,
  });
}
