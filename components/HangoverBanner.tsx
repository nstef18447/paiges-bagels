'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TimeSlotWithCapacity } from '@/types';

export default function HangoverBanner() {
  const [hasAvailable, setHasAvailable] = useState(false);

  useEffect(() => {
    checkHangoverSlots();
  }, []);

  const checkHangoverSlots = async () => {
    try {
      const response = await fetch('/api/slots?hangover=true');
      const slots: TimeSlotWithCapacity[] = await response.json();

      const now = new Date();
      const available = slots.some((slot) => {
        // Check if slot has remaining capacity
        if (slot.remaining <= 0) return false;
        // Check if past cutoff
        if (slot.cutoff_time && new Date(slot.cutoff_time) < now) return false;
        // Check if slot date hasn't passed
        const slotDate = new Date(`${slot.date}T${slot.time}`);
        if (slotDate < now) return false;
        return true;
      });

      setHasAvailable(available);
    } catch (err) {
      // Silently fail — banner just won't show
    }
  };

  if (!hasAvailable) return null;

  return (
    <Link href="/hangover" className="block mb-8">
      <div
        className="rounded-lg p-5 transition-transform hover:scale-[1.01]"
        style={{
          backgroundColor: '#FFF7ED',
          border: '2px solid #F59E0B',
        }}
      >
        <p
          className="font-bold text-lg mb-1"
          style={{ color: '#92400E' }}
        >
          Need bagels NOW?
        </p>
        <p
          className="text-sm"
          style={{ color: '#B45309' }}
        >
          Fresh sourdough ready in 1 hour — check out Hangover Bagels &rarr;
        </p>
      </div>
    </Link>
  );
}
