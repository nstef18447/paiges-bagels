import { BagelCounts } from '@/types';

export function calculateTotal(counts: BagelCounts): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

export function calculatePrice(total: number): number {
  if (total === 1) return 4;
  if (total === 3) return 10;
  if (total === 6) return 18;
  return 0;
}

export function isValidTotal(total: number): boolean {
  return total === 1 || total === 3 || total === 6;
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
    year: 'numeric',
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
  // Use Venmo's paycharge URL format which better supports the note parameter
  const encodedNote = encodeURIComponent(note);
  return `https://venmo.com/paycharge?txn=pay&recipients=${username}&amount=${amount}&note=${encodedNote}`;
}
