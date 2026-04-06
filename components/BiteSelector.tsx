'use client';

import { BiteFlavor, BiteFlavorCounts, BitePricing } from '@/types';

interface BiteSelectorProps {
  biteFlavors: BiteFlavor[];
  bitePricing: BitePricing[];
  selectedPackSize: number | null;
  onPackSizeChange: (packSize: number | null) => void;
  flavorCounts: BiteFlavorCounts;
  onFlavorCountsChange: (counts: BiteFlavorCounts) => void;
}

export default function BiteSelector({
  biteFlavors,
  bitePricing,
  selectedPackSize,
  onPackSizeChange,
  flavorCounts,
  onFlavorCountsChange,
}: BiteSelectorProps) {
  const activePricing = bitePricing.filter((p) => p.active);
  const packSizes = activePricing.map((p) => p.pack_size).sort((a, b) => a - b);
  const maxPack = packSizes.length > 0 ? packSizes[packSizes.length - 1] : 0;
  const totalSelected = Object.values(flavorCounts).reduce((sum, n) => sum + n, 0);

  // Auto-determine which pack size the current total matches
  const matchedPack = activePricing.find((p) => p.pack_size === totalSelected);
  const currentPrice = matchedPack?.price || null;

  // Determine if total is at a valid pack size
  const isValidPack = packSizes.includes(totalSelected);

  const handleIncrement = (flavorId: string) => {
    if (totalSelected >= maxPack) return;
    const newCounts = { ...flavorCounts, [flavorId]: (flavorCounts[flavorId] || 0) + 1 };
    const newTotal = totalSelected + 1;
    onFlavorCountsChange(newCounts);
    // Auto-set pack size when hitting a valid pack size
    const matched = packSizes.includes(newTotal) ? newTotal : null;
    onPackSizeChange(matched);
  };

  const handleDecrement = (flavorId: string) => {
    const current = flavorCounts[flavorId] || 0;
    if (current <= 0) return;
    const newCounts = { ...flavorCounts, [flavorId]: current - 1 };
    const newTotal = totalSelected - 1;
    onFlavorCountsChange(newCounts);
    const matched = packSizes.includes(newTotal) ? newTotal : null;
    onPackSizeChange(newTotal === 0 ? null : matched);
  };

  if (activePricing.length === 0 || biteFlavors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pricing reference */}
      <div className="grid grid-cols-3 gap-3">
        {activePricing.map((pack) => {
          const isMatched = totalSelected === pack.pack_size;
          return (
            <div
              key={pack.id}
              className="p-3 rounded-lg text-center transition-all"
              style={{
                backgroundColor: isMatched ? '#e8f0fb' : '#FFFFFF',
                border: isMatched ? '2px solid #004aad' : '2px solid #E5E0DB',
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: isMatched ? '#004AAD' : '#1A1A1A' }}
              >
                {pack.pack_size}-Pack
              </div>
              <div
                className="text-base font-semibold"
                style={{ color: isMatched ? '#004AAD' : '#6B6B6B' }}
              >
                ${pack.price.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flavor rows — always visible */}
      <div className="space-y-3">
        {biteFlavors.map((flavor) => {
          const count = flavorCounts[flavor.id] || 0;
          const isActive = count > 0;
          const atMax = totalSelected >= maxPack && count === 0;

          return (
            <div
              key={flavor.id}
              className="flex items-center gap-4 p-4 rounded-lg transition-all"
              style={{
                backgroundColor: isActive ? '#e8f0fb' : '#FFFFFF',
                border: isActive ? '2px solid #004aad' : '2px solid #E5E0DB',
              }}
            >
              {/* Flavor image */}
              <div
                className="flex-shrink-0 rounded-full overflow-hidden"
                style={{ width: '80px', height: '80px' }}
              >
                {flavor.image_url ? (
                  <img
                    src={flavor.image_url}
                    alt={flavor.name}
                    className="w-full h-full object-cover"
                    style={{
                      mixBlendMode: 'multiply',
                      objectPosition: 'center 20%',
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: '#E5E0DB' }}
                  >
                    <span className="text-sm font-medium" style={{ color: '#6B6B6B' }}>
                      {flavor.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <span
                className="flex-1 font-medium"
                style={{ color: '#1A1A1A', fontFamily: 'var(--font-playfair)' }}
              >
                {flavor.name}
              </span>

              {/* +/- controls */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDecrement(flavor.id)}
                  disabled={count === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
                  style={{
                    backgroundColor: count === 0 ? '#E5E0DB' : '#E8EDF5',
                    color: count === 0 ? '#A0A0A0' : '#004AAD',
                    cursor: count === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '18px',
                  }}
                >
                  -
                </button>
                <span
                  className="w-8 text-center font-bold text-lg"
                  style={{ color: '#1A1A1A' }}
                >
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => handleIncrement(flavor.id)}
                  disabled={atMax}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
                  style={{
                    backgroundColor: atMax ? '#E5E0DB' : '#004AAD',
                    color: atMax ? '#A0A0A0' : '#FFFFFF',
                    cursor: atMax ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '18px',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Running counter */}
      {totalSelected > 0 && (
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            backgroundColor: isValidPack ? '#E8F5E9' : '#E8EDF5',
            border: isValidPack ? '1px solid #C8DFC9' : '1px solid #D4DCE8',
          }}
        >
          <p style={{ color: isValidPack ? '#2D5A3D' : '#4A4A4A' }}>
            <span className="font-bold" style={{ color: isValidPack ? '#2D5A3D' : '#1A1A1A' }}>
              {totalSelected}
            </span>{' '}
            bites selected
            {isValidPack && currentPrice !== null && (
              <span className="ml-2 font-semibold" style={{ color: '#2D5A3D' }}>
                — ${currentPrice.toFixed(2)} &#10003;
              </span>
            )}
          </p>
          {!isValidPack && (
            <p className="text-sm mt-1" style={{ color: '#C75050' }}>
              Bites come in packs of {packSizes.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
