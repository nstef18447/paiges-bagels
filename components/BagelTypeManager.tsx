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
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
        }),
      });

      if (response.ok) {
        setName('');
        setShowForm(false);
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create bagel type');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/bagel-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update bagel type');
      }
    } catch (error) {
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
    } catch (error) {
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bagel Types</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Bagel Type'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Create New Bagel Type</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Bagel Type Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Poppy Seed, Cinnamon Raisin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
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
                className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                {editingId === type.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => handleEdit(type.id)}
                      disabled={submitting}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold">{type.name}</p>
                      <p className="text-sm text-gray-600">
                        {type.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(type.id);
                          setEditingName(type.name);
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
