'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Ingredient, AddOnType } from '@/types';

interface EditableIngredient {
  id?: string;
  name: string;
  unit: string;
  cost_per_unit: string;
  units_per_bagel: string;
  cost_type: 'per_bagel' | 'per_addon' | 'fixed';
  add_on_type_id: string | null;
  isNew?: boolean;
}

export default function AdminCostsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [addOnTypes, setAddOnTypes] = useState<AddOnType[]>([]);
  const [edited, setEdited] = useState<{ [key: string]: EditableIngredient }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchIngredients(), fetchAddOnTypes()]).then(() => setLoading(false));
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients');
      const data = await response.json();
      setIngredients(data);
      initEdited(data);
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
    }
  };

  const fetchAddOnTypes = async () => {
    try {
      const response = await fetch('/api/add-on-types');
      const data = await response.json();
      setAddOnTypes(data);
    } catch (error) {
      console.error('Failed to fetch add-on types:', error);
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
        cost_type: ing.cost_type || 'per_bagel',
        add_on_type_id: ing.add_on_type_id,
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

  const addRow = (costType: 'per_bagel' | 'per_addon' | 'fixed') => {
    const tempId = `new-${Date.now()}`;
    setEdited((prev) => ({
      ...prev,
      [tempId]: {
        name: '',
        unit: costType === 'per_bagel' ? '' : '',
        cost_per_unit: '0',
        units_per_bagel: '0',
        cost_type: costType,
        add_on_type_id: null,
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

    if (!confirm('Delete this cost entry?')) return;

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
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('An error occurred while deleting');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, item] of Object.entries(edited)) {
        const payload: Record<string, unknown> = {
          name: item.name.trim(),
          unit: item.unit.trim(),
          cost_per_unit: parseFloat(item.cost_per_unit) || 0,
          units_per_bagel: parseFloat(item.units_per_bagel) || 0,
          cost_type: item.cost_type,
          add_on_type_id: item.add_on_type_id || null,
        };

        if (!payload.name) continue;

        if (item.isNew) {
          const res = await fetch('/api/ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            alert(`Failed to create: ${item.name}`);
          }
        } else {
          const res = await fetch('/api/ingredients', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: key, ...payload }),
          });
          if (!res.ok) {
            alert(`Failed to update: ${item.name}`);
          }
        }
      }

      await fetchIngredients();
      alert('Costs saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const byType = (type: string) =>
    Object.entries(edited).filter(([, item]) => item.cost_type === type);

  const costPerBagel = byType('per_bagel').reduce((sum, [, item]) => {
    return sum + (parseFloat(item.cost_per_unit) || 0) * (parseFloat(item.units_per_bagel) || 0);
  }, 0);

  const totalFixedCosts = byType('fixed').reduce((sum, [, item]) => {
    return sum + (parseFloat(item.cost_per_unit) || 0);
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
          <Link href="/admin/prep" className="hover:underline" style={{ color: '#004AAD' }}>Prep</Link>
          <Link href="/admin/merch" className="hover:underline" style={{ color: '#004AAD' }}>Merch</Link>
        </nav>
      </div>

      {/* ── Bagel Ingredients (per bagel) ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Bagel Ingredients</h2>
            <p className="text-sm text-gray-500">Cost per unit of ingredient used per bagel</p>
          </div>
          <button
            onClick={() => addRow('per_bagel')}
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
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Cost / Bagel</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {byType('per_bagel').map(([key, item]) => {
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
                    <td className="py-2 px-2 text-gray-700">${contribution.toFixed(4)}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => handleDelete(key)} className="text-red-500 hover:text-red-700 text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {byType('per_bagel').length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No bagel ingredients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg inline-block">
          <span className="text-sm text-blue-800 font-medium">
            Ingredient Cost per Bagel: <strong>${costPerBagel.toFixed(4)}</strong>
          </span>
        </div>
      </div>

      {/* ── Add-On Costs (per unit sold) ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Add-On Costs</h2>
            <p className="text-sm text-gray-500">Cost per unit of add-on sold (e.g., schmear)</p>
          </div>
          <button
            onClick={() => addRow('per_addon')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + Add Cost
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Name</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Add-On</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Cost per Unit ($)</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {byType('per_addon').map(([key, item]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleChange(key, 'name', e.target.value)}
                      placeholder="e.g., Cream Cheese"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <select
                      value={item.add_on_type_id || ''}
                      onChange={(e) => handleChange(key, 'add_on_type_id', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    >
                      <option value="">Select add-on...</option>
                      {addOnTypes.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
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
                    <button onClick={() => handleDelete(key)} className="text-red-500 hover:text-red-700 text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {byType('per_addon').length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    No add-on costs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Fixed Costs (amortized) ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Fixed Costs</h2>
            <p className="text-sm text-gray-500">Total amounts amortized across all bagels sold</p>
          </div>
          <button
            onClick={() => addRow('fixed')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + Add Fixed Cost
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Name</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Total Cost ($)</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {byType('fixed').map(([key, item]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleChange(key, 'name', e.target.value)}
                      placeholder="e.g., Equipment, Packaging"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.cost_per_unit}
                      onChange={(e) => handleChange(key, 'cost_per_unit', e.target.value)}
                      className="w-36 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <button onClick={() => handleDelete(key)} className="text-red-500 hover:text-red-700 text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {byType('fixed').length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    No fixed costs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalFixedCosts > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg inline-block">
            <span className="text-sm text-amber-800 font-medium">
              Total Fixed Costs: <strong>${totalFixedCosts.toFixed(2)}</strong>
              <span className="text-amber-600"> — amortized over all bagels sold in financials</span>
            </span>
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 px-6 bg-[#004AAD] text-white font-semibold rounded-lg hover:bg-[#003A8C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Save All Costs'}
      </button>
    </div>
  );
}
