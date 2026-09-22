import { BagelCounts, Pricing } from '@/types';

export function calculateTotal(counts: BagelCounts): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

export function calculateBundlePrice(total: number, pricingTiers: Pricing[]): number {
  if (total <= 0) return 0;
  const sorted = [...pricingTiers].sort((a, b) => b.bagel_quantity - a.bagel_quantity);
  let remaining = total;
  let price = 0;
  while (remaining > 0) {
    const tier = sorted.find((t) => t.bagel_quantity <= remaining);
    if (!tier) break;
    price += tier.price;
    remaining -= tier.bagel_quantity;
  }
  return price;
}

// A spread bought alongside bagels takes 50c off the order — the "combo".
// Shared by the order form and the orders API so the two can't drift apart.
export const COMBO_DISCOUNT = 0.5;

export function calculateComboDiscount(totalBagels: number, addOnUnits: number): number {
  if (totalBagels <= 0 || addOnUnits <= 0) return 0;
  return COMBO_DISCOUNT;
}

export function isValidTotal(total: number): boolean {
  return total >= 1 && total <= 13;
}

export function generateVenmoNote(orderId: string, date?: string, time?: string): string {
  const base = `Paige's Bagels :) 🥯 Order: ${orderId.slice(0, 8)}`;
  if (!date || !time) return base;
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const [hours] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${base} | ${dateStr} @ ${hour12}${ampm}`;
}

export function formatDate(dateString: string): string {
  // Parse date without timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(time: string): string {
  // Convert 24-hour time to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
  return `${hour12}:${minutes} ${ampm}`;
}

export function generateVenmoLink(
  username: string,
  amount: number,
  note: string
): string {
  const encodedNote = encodeURIComponent(note);
  const formattedAmount = amount.toFixed(2);
  return `https://venmo.com/${username}?txn=pay&amount=${formattedAmount}&note=${encodedNote}`;
}
