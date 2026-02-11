'use client';

import { useState } from 'react';
import { BagelType } from '@/types';

interface BagelTypeManagerProps {
  bagelTypes: BagelType[];
  onRefresh: () => void;
}

export default function BagelTypeManager({ bagelTypes, onRefresh }: BagelTypeManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    image_url: '',
    description: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
  });

  const resetForm = () => {
    setName('');
    setImageUrl('');
    setDescription('');
    setCalories('');
    setProteinG('');
    setCarbsG('');
    setFatG('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/bagel-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          display_order: bagelTypes.length + 1,
          image_url: imageUrl || null,
          description: description || null,
          calories: calories ? parseInt(calories) : null,
          protein_g: proteinG ? parseFloat(proteinG) : null,
          carbs_g: carbsG ? parseFloat(carbsG) : null,
          fat_g: fatG ? parseFloat(fatG) : null,
        }),
      });

      if (response.ok) {
        resetForm();
        setShowForm(false);
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create bagel type');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (type: BagelType) => {
    setEditingId(type.id);
    setEditForm({
      name: type.name,
      image_url: type.image_url || '',
      description: type.description || '',
      calories: type.calories?.toString() || '',
      protein_g: type.protein_g?.toString() || '',
      carbs_g: type.carbs_g?.toString() || '',
      fat_g: type.fat_g?.toString() || '',
    });
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/bagel-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          image_url: editForm.image_url || null,
          description: editForm.description || null,
          calories: editForm.calories ? parseInt(editForm.calories) : null,
          protein_g: editForm.protein_g ? parseFloat(editForm.protein_g) : null,
          carbs_g: editForm.carbs_g ? parseFloat(editForm.carbs_g) : null,
          fat_g: editForm.fat_g ? parseFloat(editForm.fat_g) : null,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update bagel type');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will hide it from customers.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bagel-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to delete bagel type');
      }
    } catch {
      alert('An error occurred');
    }
  };

  const MacroInputs = ({
    prefix,
    values,
    onChange,
  }: {
    prefix: string;
    values: { calories: string; protein_g: string; carbs_g: string; fat_g: string };
    onChange: (field: string, value: string) => void;
  }) => (
    <div className="grid grid-cols-4 gap-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Calories</label>
        <input
          type="number"
          min="0"
          value={values.calories}
          onChange={(e) => onChange(`${prefix}calories`, e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Protein (g)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={values.protein_g}
          onChange={(e) => onChange(`${prefix}protein_g`, e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Carbs (g)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={values.carbs_g}
          onChange={(e) => onChange(`${prefix}carbs_g`, e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Fat (g)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={values.fat_g}
          onChange={(e) => onChange(`${prefix}fat_g`, e.target.value)}
          placeholder="0"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bagel Types</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003A8C] transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Bagel Type'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Create New Bagel Type</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Poppy Seed, Cinnamon Raisin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Filename <span className="text-gray-400 font-normal">(in /public)</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="e.g., plain.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Bread flour, water, salt, sourdough starter, malt syrup"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Macros</label>
              <MacroInputs
                prefix=""
                values={{ calories, protein_g: proteinG, carbs_g: carbsG, fat_g: fatG }}
                onChange={(field, value) => {
                  if (field === 'calories') setCalories(value);
                  if (field === 'protein_g') setProteinG(value);
                  if (field === 'carbs_g') setCarbsG(value);
                  if (field === 'fat_g') setFatG(value);
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Bagel Type'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Available Bagel Types</h3>

        {bagelTypes.length === 0 ? (
          <p className="text-gray-500">No bagel types created yet</p>
        ) : (
          <div className="grid gap-3">
            {bagelTypes.map((type) => (
              <div
                key={type.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                {editingId === type.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Image Filename</label>
                      <input
                        type="text"
                        value={editForm.image_url}
                        onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                        placeholder="e.g., plain.jpg"
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ingredients</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Macros</label>
                      <MacroInputs
                        prefix="edit_"
                        values={editForm}
                        onChange={(field, value) => {
                          const key = field.replace('edit_', '');
                          setEditForm({ ...editForm, [key]: value });
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(type.id)}
                        disabled={submitting}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{type.name}</p>
                      <p className="text-sm text-gray-600">
                        {type.active ? 'Active' : 'Inactive'}
                        {type.image_url && ` · ${type.image_url}`}
                        {type.calories && ` · ${type.calories} cal`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(type)}
                        className="px-3 py-1 bg-[#004AAD] text-white rounded-lg hover:bg-[#003A8C]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id, type.name)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
