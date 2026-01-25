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
      <h3 className="font-semibold text-lg">Select Pickup Time</h3>

      {Object.entries(slotsByDate).length === 0 ? (
        <p className="text-gray-500">No time slots available</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <div key={date}>
              <h4 className="font-medium text-gray-700 mb-2">{formatDate(date)}</h4>
              <div className="grid grid-cols-2 gap-2">
                {dateSlots.map((slot) => {
                  const isAvailable = slot.remaining >= requiredCapacity;
                  const isSelected = slot.id === selectedSlotId;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => isAvailable && onChange(slot.id)}
                      disabled={!isAvailable}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-all
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                        ${!isAvailable && 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className="font-medium">{formatTime(slot.time)}</div>
                      <div className={`text-sm ${isAvailable ? 'text-gray-600' : 'text-red-600'}`}>
                        {slot.remaining} bagels left
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
