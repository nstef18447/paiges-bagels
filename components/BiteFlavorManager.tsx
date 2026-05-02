'use client';

import { useState } from 'react';
import { BiteFlavor } from '@/types';

interface BiteFlavorManagerProps {
  biteFlavors: BiteFlavor[];
  onRefresh: () => void;
}

export default function BiteFlavorManager({ biteFlavors, onRefresh }: BiteFlavorManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '' });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const autoSlug = (value: string) => {
    return value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/bite-flavors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || autoSlug(name),
          sort_order: biteFlavors.length + 1,
        }),
      });

      if (response.ok) {
        setName('');
        setSlug('');
        setShowForm(false);
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create bite flavor');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/bite-flavors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          slug: editForm.slug,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update bite flavor');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/bite-flavors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to toggle flavor status');
      }
    } catch {
      alert('An error occurred');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will hide it from customers.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bite-flavors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to delete bite flavor');
      }
    } catch {
      alert('An error occurred');
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    setUploadingId(id);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/bite-flavors/${id}/image`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('An error occurred uploading image');
    } finally {
      setUploadingId(null);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = biteFlavors.findIndex((f) => f.id === id);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= biteFlavors.length) return;

    try {
      await Promise.all([
        fetch(`/api/bite-flavors/${biteFlavors[index].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: biteFlavors[swapIndex].sort_order }),
        }),
        fetch(`/api/bite-flavors/${biteFlavors[swapIndex].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: biteFlavors[index].sort_order }),
        }),
      ]);
      onRefresh();
    } catch {
      alert('An error occurred reordering');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bite Flavors</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003A8C] transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Bite Flavor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Create New Bite Flavor</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === autoSlug(name)) {
                    setSlug(autoSlug(e.target.value));
                  }
                }}
                placeholder="e.g., Everything, Flaky Salt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-gray-400 font-normal">(used as JSON key in orders)</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(autoSlug(e.target.value))}
                placeholder="e.g., everything, flaky_salt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Bite Flavor'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Available Bite Flavors</h3>

        {biteFlavors.length === 0 ? (
          <p className="text-gray-500">No bite flavors created yet</p>
        ) : (
          <div className="grid gap-3">
            {biteFlavors.map((flavor, index) => (
              <div
                key={flavor.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                {editingId === flavor.id ? (
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
                      <label className="block text-xs text-gray-500 mb-1">Slug</label>
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: autoSlug(e.target.value) })}
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(flavor.id)}
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
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {flavor.image_url ? (
                        <img
                          src={flavor.image_url}
                          alt={flavor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No img</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-semibold">{flavor.name}</p>
                      <p className="text-sm text-gray-600">
                        slug: {flavor.slug} · order: {flavor.sort_order} · {flavor.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                      {/* Reorder */}
                      <button
                        onClick={() => handleReorder(flavor.id, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                        title="Move up"
                      >
                        &uarr;
                      </button>
                      <button
                        onClick={() => handleReorder(flavor.id, 'down')}
                        disabled={index === biteFlavors.length - 1}
                        className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                        title="Move down"
                      >
                        &darr;
                      </button>

                      {/* Image upload */}
                      <label className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer text-sm">
                        {uploadingId === flavor.id ? 'Uploading...' : 'Image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingId === flavor.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(flavor.id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggleActive(flavor.id, flavor.active)}
                        className={`px-3 py-1 text-white rounded-lg text-sm ${
                          flavor.active
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {flavor.active ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(flavor.id);
                          setEditForm({ name: flavor.name, slug: flavor.slug });
                        }}
                        className="px-3 py-1 bg-[#004AAD] text-white rounded-lg hover:bg-[#003A8C] text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(flavor.id, flavor.name)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
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
