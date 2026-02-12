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

export function isValidTotal(total: number): boolean {
  return total >= 1 && total <= 13;
}

export function generateVenmoNote(orderId: string): string {
  return `Paige's Bagels :) 🥯 Order: ${orderId.slice(0, 8)}`;
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
  return `https://venmo.com/${username}?txn=pay&amount=${amount}&note=${encodedNote}`;
}
