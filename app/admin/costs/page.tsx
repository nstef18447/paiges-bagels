'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Ingredient } from '@/types';

interface EditableIngredient {
  id?: string;
  name: string;
  unit: string;
  cost_per_unit: string;
  units_per_bagel: string;
  isNew?: boolean;
}

export default function AdminCostsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [edited, setEdited] = useState<{ [key: string]: EditableIngredient }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients');
      const data = await response.json();
      setIngredients(data);
      initEdited(data);
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const initEdited = (data: Ingredient[]) => {
    const map: { [key: string]: EditableIngredient } = {};
    data.forEach((ing) => {
      map[ing.id] = {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        cost_per_unit: ing.cost_per_unit.toString(),
        units_per_bagel: ing.units_per_bagel.toString(),
      };
    });
    setEdited(map);
  };

  const handleChange = (key: string, field: keyof EditableIngredient, value: string) => {
    setEdited((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const addRow = () => {
    const tempId = `new-${Date.now()}`;
    setEdited((prev) => ({
      ...prev,
      [tempId]: {
        name: '',
        unit: '',
        cost_per_unit: '0',
        units_per_bagel: '0',
        isNew: true,
      },
    }));
  };

  const handleDelete = async (key: string) => {
    const item = edited[key];
    if (item.isNew) {
      setEdited((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }

    if (!confirm('Delete this ingredient?')) return;

    try {
      const response = await fetch(`/api/ingredients?id=${key}`, { method: 'DELETE' });
      if (response.ok) {
        setEdited((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
        setIngredients((prev) => prev.filter((i) => i.id !== key));
      } else {
        alert('Failed to delete ingredient');
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('An error occurred while deleting');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, item] of Object.entries(edited)) {
        const payload = {
          name: item.name.trim(),
          unit: item.unit.trim(),
          cost_per_unit: parseFloat(item.cost_per_unit) || 0,
          units_per_bagel: parseFloat(item.units_per_bagel) || 0,
        };

        if (!payload.name || !payload.unit) continue;

        if (item.isNew) {
          const res = await fetch('/api/ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            alert(`Failed to create ingredient: ${item.name}`);
          }
        } else {
          const res = await fetch('/api/ingredients', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: key, ...payload }),
          });
          if (!res.ok) {
            alert(`Failed to update ingredient: ${item.name}`);
          }
        }
      }

      await fetchIngredients();
      alert('Ingredients saved successfully!');
    } catch (error) {
      console.error('Error saving ingredients:', error);
      alert('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const costPerBagel = Object.values(edited).reduce((sum, item) => {
    return sum + (parseFloat(item.cost_per_unit) || 0) * (parseFloat(item.units_per_bagel) || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="mb-4">
          <Link href="/admin/orders">
            <Image src="/logo.png" alt="Paige's Bagels" width={200} height={80} priority />
          </Link>
        </div>
        <nav className="flex gap-4">
          <Link href="/admin/orders" className="hover:underline" style={{ color: '#004AAD' }}>Orders</Link>
          <Link href="/admin/slots" className="hover:underline" style={{ color: '#004AAD' }}>Time Slots</Link>
          <Link href="/admin/bagel-types" className="hover:underline" style={{ color: '#004AAD' }}>Bagel Types</Link>
          <Link href="/admin/add-ons" className="hover:underline" style={{ color: '#004AAD' }}>Add-Ons</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Manage Ingredients</h2>
          <button
            onClick={addRow}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + Add Ingredient
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Name</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Unit</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Cost per Unit ($)</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Units per Bagel</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Cost Contribution</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(edited).map(([key, item]) => {
                const contribution =
                  (parseFloat(item.cost_per_unit) || 0) * (parseFloat(item.units_per_bagel) || 0);
                return (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleChange(key, 'name', e.target.value)}
                        placeholder="e.g., Bread Flour"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleChange(key, 'unit', e.target.value)}
                        placeholder="e.g., lb"
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.cost_per_unit}
                        onChange={(e) => handleChange(key, 'cost_per_unit', e.target.value)}
                        className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={item.units_per_bagel}
                        onChange={(e) => handleChange(key, 'units_per_bagel', e.target.value)}
                        className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      ${contribution.toFixed(4)}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleDelete(key)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {Object.keys(edited).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No ingredients yet. Click &quot;Add Ingredient&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold text-blue-900">Cost per Bagel: </span>
            <span className="text-2xl font-bold text-blue-700">${costPerBagel.toFixed(4)}</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 px-6 bg-[#004AAD] text-white font-semibold rounded-lg hover:bg-[#003A8C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save All Ingredients'}
        </button>
      </div>
    </div>
  );
}
