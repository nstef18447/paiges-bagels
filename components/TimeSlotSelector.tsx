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
                  const isSoldOut = slot.remaining === 0;
                  const isAvailable = slot.remaining >= requiredCapacity && !isSoldOut;
                  const isSelected = slot.id === selectedSlotId;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => isAvailable && onChange(slot.id)}
                      disabled={!isAvailable}
                      className="p-4 rounded-lg text-left transition-all relative overflow-hidden"
                      style={{
                        border: isSoldOut
                          ? '2px solid #DC2626'
                          : isSelected
                            ? '2px solid #004AAD'
                            : '1px solid #E5E0DB',
                        backgroundColor: isSoldOut
                          ? '#FEF2F2'
                          : isSelected
                            ? '#E8EDF5'
                            : '#FFFFFF',
                        opacity: isAvailable ? 1 : isSoldOut ? 1 : 0.5,
                        cursor: isAvailable ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {/* X overlay for sold out */}
                      {isSoldOut && (
                        <>
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: 'linear-gradient(to top right, transparent calc(50% - 1px), #DC2626 calc(50% - 1px), #DC2626 calc(50% + 1px), transparent calc(50% + 1px))'
                            }}
                          />
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: 'linear-gradient(to bottom right, transparent calc(50% - 1px), #DC2626 calc(50% - 1px), #DC2626 calc(50% + 1px), transparent calc(50% + 1px))'
                            }}
                          />
                        </>
                      )}
                      <div
                        className="font-semibold"
                        style={{ color: isSoldOut ? '#991B1B' : isSelected ? '#004AAD' : '#1A1A1A' }}
                      >
                        {formatTime(slot.time)}
                      </div>
                      {isSoldOut ? (
                        <div
                          className="text-sm mt-1 font-bold uppercase tracking-wide"
                          style={{ color: '#DC2626' }}
                        >
                          SOLD OUT
                        </div>
                      ) : (
                        <div
                          className="text-sm mt-1"
                          style={{ color: isAvailable ? '#6B6B6B' : '#C75050' }}
                        >
                          {slot.remaining} bagels available
                        </div>
                      )}
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
