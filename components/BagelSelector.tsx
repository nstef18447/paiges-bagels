'use client';

import { BagelCounts, BagelType } from '@/types';
import { calculateTotal } from '@/lib/utils';

interface BagelSelectorProps {
  bagelTypes: BagelType[];
  counts: BagelCounts;
  onChange: (counts: BagelCounts) => void;
  maxTotal: number;
}

export default function BagelSelector({ bagelTypes, counts, onChange, maxTotal }: BagelSelectorProps) {
  const total = calculateTotal(counts);

  const handleIncrement = (bagelTypeId: string) => {
    if (total < maxTotal) {
      onChange({ ...counts, [bagelTypeId]: (counts[bagelTypeId] || 0) + 1 });
    }
  };

  const handleDecrement = (bagelTypeId: string) => {
    const currentCount = counts[bagelTypeId] || 0;
    if (currentCount > 0) {
      onChange({ ...counts, [bagelTypeId]: currentCount - 1 });
    }
  };

  if (bagelTypes.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Select Your Bagels</h3>
        <p className="text-gray-500">No bagel types available. Please contact the shop.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Select Your Bagels</h3>

      <div className="space-y-3">
        {bagelTypes.map((type) => (
          <BagelCounter
            key={type.id}
            label={type.name}
            count={counts[type.id] || 0}
            onIncrement={() => handleIncrement(type.id)}
            onDecrement={() => handleDecrement(type.id)}
            disabled={total >= maxTotal && (counts[type.id] || 0) === 0}
          />
        ))}
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          Total: <span className="font-bold text-gray-900">{total}</span> bagels
        </p>
        {total > 0 && total !== 1 && total !== 3 && total !== 6 && (
          <p className="text-sm text-red-600 mt-1">
            Please select exactly 1, 3, or 6 bagels
          </p>
        )}
      </div>
    </div>
  );
}

interface BagelCounterProps {
  label: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

function BagelCounter({ label, count, onIncrement, onDecrement, disabled }: BagelCounterProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={count === 0}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="w-8 text-center font-semibold">{count}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
