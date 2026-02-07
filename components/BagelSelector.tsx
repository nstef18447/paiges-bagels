'use client';

import { BagelCounts, BagelType } from '@/types';
import { calculateTotal, isValidTotal } from '@/lib/utils';

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
        <p style={{ color: '#6B6B6B' }}>No bagel types available. Please contact the shop.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <div
        className="mt-4 p-4 rounded-lg"
        style={{
          backgroundColor: '#E8EDF5',
          border: '1px solid #D4DCE8'
        }}
      >
        <p style={{ color: '#4A4A4A' }}>
          Total: <span className="font-bold" style={{ color: '#1A1A1A' }}>{total}</span> bagels
        </p>
        {total > 0 && !isValidTotal(total) && (
          <p className="text-sm mt-1" style={{ color: '#C75050' }}>
            Please select between 1 and 6 bagels
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
    <div
      className="flex items-center justify-between p-4 rounded-lg"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E0DB'
      }}
    >
      <span className="font-medium" style={{ color: '#1A1A1A' }}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={count === 0}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
          style={{
            backgroundColor: count === 0 ? '#E5E0DB' : '#E8EDF5',
            color: count === 0 ? '#A0A0A0' : '#004AAD',
            cursor: count === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '18px'
          }}
        >
          −
        </button>
        <span
          className="w-8 text-center font-bold text-lg"
          style={{ color: '#1A1A1A' }}
        >
          {count}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
          style={{
            backgroundColor: disabled ? '#E5E0DB' : '#004AAD',
            color: disabled ? '#A0A0A0' : '#FFFFFF',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '18px'
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
