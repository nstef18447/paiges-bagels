'use client';

import { TimeSlotWithCapacity } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface TimeSlotSelectorProps {
  slots: TimeSlotWithCapacity[];
  selectedSlotId: string;
  onChange: (slotId: string) => void;
  requiredCapacity: number;
}

function isPastCutoff(cutoffTime: string | null): boolean {
  if (!cutoffTime) return false;
  return new Date() > new Date(cutoffTime);
}

function formatCutoff(cutoffTime: string): string {
  const date = new Date(cutoffTime);
  const timeZone = 'America/Chicago';
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone
  });
  return `${dateStr} at ${timeStr}`;
}

function getSlotStatus(slot: TimeSlotWithCapacity, requiredCapacity: number) {
  if (slot.remaining <= 0) return 'sold-out';
  if (slot.remaining < requiredCapacity) return 'sold-out';
  if (slot.remaining <= 12) return 'low';
  return 'available';
}

export default function TimeSlotSelector({
  slots,
  selectedSlotId,
  onChange,
  requiredCapacity,
}: TimeSlotSelectorProps) {
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlotWithCapacity[]>);

  const filteredDates = Object.entries(slotsByDate)
    .filter(([, dateSlots]) => dateSlots.some(s => !isPastCutoff(s.cutoff_time)));

  if (filteredDates.length === 0) {
    return <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No time slots available</p>;
  }

  return (
    <div className="space-y-8">
      {filteredDates.map(([date, dateSlots]) => {
        const cutoffSlot = dateSlots.find(s => s.cutoff_time && !isPastCutoff(s.cutoff_time));

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-1">
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--blue)', fontFamily: 'var(--font-playfair)' }}
              >
                {formatDate(date)}
              </h2>
              {cutoffSlot?.cutoff_time && (
                <span className="text-[0.78rem] font-medium flex items-center gap-1" style={{ color: 'var(--brown)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--brown)">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                  </svg>
                  Order by {formatCutoff(cutoffSlot.cutoff_time)}
                </span>
              )}
            </div>

            {/* Slot grid */}
            <div className="grid grid-cols-2 gap-2.5 md:gap-3">
              {dateSlots
                .filter(slot => !isPastCutoff(slot.cutoff_time))
                .map((slot) => {
                  const status = getSlotStatus(slot, requiredCapacity);
                  const isSelected = slot.id === selectedSlotId;
                  const isDisabled = status === 'sold-out';

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => !isDisabled && onChange(slot.id)}
                      disabled={isDisabled}
                      className="relative rounded-[10px] p-4 md:p-5 text-left transition-all duration-200 cursor-pointer active:scale-[0.98]"
                      style={{
                        background: isSelected ? 'var(--blue-light)' : 'var(--bg-card)',
                        border: isSelected
                          ? '1.5px solid var(--blue)'
                          : '1.5px solid var(--border)',
                        boxShadow: isSelected ? '0 0 0 3px rgba(0, 74, 173, 0.12)' : 'none',
                        opacity: isDisabled ? 0.45 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <span
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--blue)' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          </svg>
                        </span>
                      )}

                      {/* Time */}
                      <div className="text-[1.05rem] font-bold mb-1" style={{ color: 'var(--blue)' }}>
                        {formatTime(slot.time)}
                      </div>

                      {/* Status */}
                      <div className="text-[0.78rem] font-medium flex items-center gap-[5px]">
                        {status === 'available' && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--green)' }} />
                            <span style={{ color: 'var(--green)' }}>Available</span>
                          </>
                        )}
                        {status === 'low' && (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: 'var(--amber)', animation: 'pulse-dot 2s ease infinite' }}
                            />
                            <span style={{ color: 'var(--amber)' }}>Only {slot.remaining} left!</span>
                          </>
                        )}
                        {status === 'sold-out' && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--red)' }} />
                            <span style={{ color: 'var(--red)' }}>Sold Out</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
