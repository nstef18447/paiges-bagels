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
  const totalSelected = Object.values(flavorCounts).reduce((sum, n) => sum + n, 0);

  const handlePackSelect = (packSize: number) => {
    if (selectedPackSize === packSize) {
      // Deselect
      onPackSizeChange(null);
      onFlavorCountsChange({});
    } else {
      onPackSizeChange(packSize);
      // Reset flavor counts when changing pack size
      onFlavorCountsChange({});
    }
  };

  const handleIncrement = (flavorId: string) => {
    if (!selectedPackSize || totalSelected >= selectedPackSize) return;
    onFlavorCountsChange({
      ...flavorCounts,
      [flavorId]: (flavorCounts[flavorId] || 0) + 1,
    });
  };

  const handleDecrement = (flavorId: string) => {
    const current = flavorCounts[flavorId] || 0;
    if (current <= 0) return;
    onFlavorCountsChange({
      ...flavorCounts,
      [flavorId]: current - 1,
    });
  };

  if (activePricing.length === 0 || biteFlavors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pack size selector */}
      <div className="grid grid-cols-3 gap-3">
        {activePricing.map((pack) => {
          const isSelected = selectedPackSize === pack.pack_size;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => handlePackSelect(pack.pack_size)}
              className="p-4 rounded-lg text-center transition-all"
              style={{
                backgroundColor: isSelected ? '#e8f0fb' : '#FFFFFF',
                border: isSelected ? '2px solid #004aad' : '2px solid #E5E0DB',
                cursor: 'pointer',
              }}
            >
              <div
                className="text-xl font-bold"
                style={{ color: isSelected ? '#004AAD' : '#1A1A1A' }}
              >
                {pack.pack_size}-Pack
              </div>
              <div
                className="text-lg font-semibold mt-1"
                style={{ color: isSelected ? '#004AAD' : '#6B6B6B' }}
              >
                ${pack.price.toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Flavor rows */}
      {selectedPackSize && (
        <>
          <div className="space-y-3">
            {biteFlavors.map((flavor) => {
              const count = flavorCounts[flavor.id] || 0;
              const isActive = count > 0;
              const atMax = totalSelected >= selectedPackSize && count === 0;

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
                  <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center">
                    {flavor.image_url ? (
                      <img
                        src={flavor.image_url}
                        alt={flavor.name}
                        className="w-full h-full object-contain rounded-full"
                        style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.12))' }}
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center"
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
          <div
            className="mt-4 p-4 rounded-lg"
            style={{
              backgroundColor: totalSelected === selectedPackSize ? '#E8F5E9' : '#E8EDF5',
              border: totalSelected === selectedPackSize ? '1px solid #C8DFC9' : '1px solid #D4DCE8',
            }}
          >
            <p style={{ color: totalSelected === selectedPackSize ? '#2D5A3D' : '#4A4A4A' }}>
              <span className="font-bold" style={{ color: totalSelected === selectedPackSize ? '#2D5A3D' : '#1A1A1A' }}>
                {totalSelected} of {selectedPackSize}
              </span>{' '}
              bites selected
              {totalSelected === selectedPackSize && (
                <span className="ml-2 text-green-600 font-semibold">&#10003;</span>
              )}
            </p>
            {totalSelected > 0 && totalSelected < selectedPackSize && (
              <p className="text-sm mt-1" style={{ color: '#C75050' }}>
                Please select exactly {selectedPackSize} bites
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
