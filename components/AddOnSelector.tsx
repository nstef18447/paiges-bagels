'use client';

import { AddOnCounts, AddOnType } from '@/types';

interface AddOnSelectorProps {
  addOnTypes: AddOnType[];
  counts: AddOnCounts;
  onChange: (counts: AddOnCounts) => void;
}

export default function AddOnSelector({ addOnTypes, counts, onChange }: AddOnSelectorProps) {
  const handleIncrement = (addOnTypeId: string) => {
    onChange({ ...counts, [addOnTypeId]: (counts[addOnTypeId] || 0) + 1 });
  };

  const handleDecrement = (addOnTypeId: string) => {
    const currentCount = counts[addOnTypeId] || 0;
    if (currentCount > 0) {
      onChange({ ...counts, [addOnTypeId]: currentCount - 1 });
    }
  };

  const subtotal = addOnTypes.reduce((sum, type) => {
    return sum + (counts[type.id] || 0) * type.price;
  }, 0);

  if (addOnTypes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {addOnTypes.map((type) => (
          <AddOnCounter
            key={type.id}
            label={type.name}
            price={type.price}
            count={counts[type.id] || 0}
            onIncrement={() => handleIncrement(type.id)}
            onDecrement={() => handleDecrement(type.id)}
          />
        ))}
      </div>

      {subtotal > 0 && (
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            backgroundColor: '#E8EDF5',
            border: '1px solid #D4DCE8'
          }}
        >
          <p style={{ color: '#4A4A4A' }}>
            Add-ons subtotal: <span className="font-bold" style={{ color: '#1A1A1A' }}>${subtotal.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

interface AddOnCounterProps {
  label: string;
  price: number;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function AddOnCounter({ label, price, count, onIncrement, onDecrement }: AddOnCounterProps) {
  const isActive = count > 0;

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg transition-all"
      style={{
        backgroundColor: isActive ? '#e8f0fb' : '#FFFFFF',
        border: isActive ? '2px solid #004aad' : '2px solid #E5E0DB',
      }}
    >
      <div>
        <span className="font-medium" style={{ color: '#1A1A1A' }}>{label}</span>
        <span className="ml-2 text-sm" style={{ color: '#6B6B6B' }}>${price.toFixed(2)} each</span>
      </div>
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
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
          style={{
            backgroundColor: '#004AAD',
            color: '#FFFFFF',
            cursor: 'pointer',
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
