'use client';

import { TimeSlotWithCapacity } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface TimeSlotSelectorProps {
  slots: TimeSlotWithCapacity[];
  selectedSlotId: string;
  onChange: (slotId: string) => void;
  requiredCapacity: number;
}

export default function TimeSlotSelector({
  slots,
  selectedSlotId,
  onChange,
  requiredCapacity,
}: TimeSlotSelectorProps) {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlotWithCapacity[]>);

  return (
    <div className="space-y-4">
      {Object.entries(slotsByDate).length === 0 ? (
        <p style={{ color: '#6B6B6B' }}>No time slots available</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <div key={date}>
              <h4
                className="font-medium mb-3"
                style={{ color: '#4A4A4A' }}
              >
                {formatDate(date)}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {dateSlots.map((slot) => {
                  const isAvailable = slot.remaining >= requiredCapacity;
                  const isSelected = slot.id === selectedSlotId;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => isAvailable && onChange(slot.id)}
                      disabled={!isAvailable}
                      className="p-4 rounded-lg text-left transition-all"
                      style={{
                        border: isSelected ? '2px solid #D4894B' : '1px solid #E5E0DB',
                        backgroundColor: isSelected ? '#FDF8F3' : '#FFFFFF',
                        opacity: isAvailable ? 1 : 0.5,
                        cursor: isAvailable ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <div
                        className="font-semibold"
                        style={{ color: isSelected ? '#B8743D' : '#1A1A1A' }}
                      >
                        {formatTime(slot.time)}
                      </div>
                      <div
                        className="text-sm mt-1"
                        style={{ color: isAvailable ? '#6B6B6B' : '#C75050' }}
                      >
                        {slot.remaining} bagels available
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
