'use client';

import { AddOnCounts, AddOnType } from '@/types';
import { isSpecial, PINK, SPRINKLE_BACKGROUND } from '@/lib/specials';
import { SpecialBadge } from './BagelSelector';

interface AddOnSelectorProps {
  addOnTypes: AddOnType[];
  counts: AddOnCounts;
  onChange: (counts: AddOnCounts) => void;
  /** A spread is on the order alongside bagels, so the 50c combo is applied. */
  comboActive?: boolean;
  /** Bagels are on the order but no spread is — the combo is still available. */
  comboHint?: boolean;
}

export default function AddOnSelector({
  addOnTypes,
  counts,
  onChange,
  comboActive = false,
  comboHint = false,
}: AddOnSelectorProps) {
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
            special={isSpecial(type.name)}
            count={counts[type.id] || 0}
            onIncrement={() => handleIncrement(type.id)}
            onDecrement={() => handleDecrement(type.id)}
          />
        ))}
      </div>

      {(comboActive || comboHint) && (
        <div
          className="p-3 rounded-lg flex items-center gap-2.5"
          style={{
            backgroundColor: comboActive ? '#EAF5EC' : '#FFFFFF',
            border: comboActive ? '1px solid #C8DFC9' : '1px solid #E5E0DB',
          }}
        >
          <span className="text-base leading-none" aria-hidden="true">{comboActive ? '🎉' : '🥯'}</span>
          <p className="text-[0.85rem] leading-snug" style={{ color: '#4A4A4A' }}>
            {comboActive ? (
              <>
                <strong style={{ color: '#2D5A3D' }}>Combo applied</strong> &mdash; 50&cent; off for adding a
                spread to your bagels.
              </>
            ) : (
              <>
                Add a spread to your bagels and <strong style={{ color: '#004AAD' }}>take 50&cent; off</strong> the order.
              </>
            )}
          </p>
        </div>
      )}

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
  special?: boolean;
}

function AddOnCounter({ label, price, count, onIncrement, onDecrement, special }: AddOnCounterProps) {
  const isActive = count > 0;
  const accent = special ? PINK.strong : '#004AAD';
  const accentLight = special ? PINK.soft : '#E8EDF5';

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg transition-all"
      style={
        special
          ? {
              backgroundColor: isActive ? PINK.bgActive : PINK.bg,
              backgroundImage: SPRINKLE_BACKGROUND,
              border: `2px ${isActive ? 'solid' : 'dashed'} ${isActive ? PINK.strong : PINK.border}`,
            }
          : {
              backgroundColor: isActive ? '#e8f0fb' : '#FFFFFF',
              border: isActive ? '2px solid #004aad' : '2px solid #E5E0DB',
            }
      }
    >
      <div>
        <span className="font-medium" style={{ color: special ? PINK.text : '#1A1A1A' }}>{label}</span>
        <span className="ml-2 text-sm" style={{ color: special ? PINK.text : '#6B6B6B' }}>${price.toFixed(2)} each</span>
        {special && <SpecialBadge />}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={count === 0}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
          style={{
            backgroundColor: count === 0 ? '#E5E0DB' : accentLight,
            color: count === 0 ? '#A0A0A0' : accent,
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
            backgroundColor: accent,
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
