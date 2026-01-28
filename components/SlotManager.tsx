'use client';

import { useState } from 'react';
import { TimeSlotWithCapacity } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface SlotManagerProps {
  slots: TimeSlotWithCapacity[];
  onRefresh: () => void;
}

export default function SlotManager({ slots, onRefresh }: SlotManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [capacity, setCapacity] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCapacity, setEditCapacity] = useState(12);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, capacity }),
      });

      if (response.ok) {
        setDate('');
        setTime('');
        setCapacity(12);
        setShowForm(false);
        onRefresh();
      } else {
        alert('Failed to create time slot');
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
      const response = await fetch(`/api/slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editDate,
          time: editTime,
          capacity: editCapacity,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update time slot');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete time slot');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const startEditing = (slot: TimeSlotWithCapacity) => {
    setEditingId(slot.id);
    setEditDate(slot.date);
    setEditTime(slot.time);
    setEditCapacity(slot.capacity);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDate('');
    setEditTime('');
    setEditCapacity(12);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Time Slot Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003A8C] transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Time Slot'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Create New Time Slot</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (bagels)
              </label>
              <input
                type="number"
                id="capacity"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Time Slot'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Existing Time Slots</h3>

        {slots.length === 0 ? (
          <p className="text-gray-500">No time slots created yet</p>
        ) : (
          <div className="grid gap-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                {editingId === slot.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Time</label>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Capacity</label>
                        <input
                          type="number"
                          value={editCapacity}
                          onChange={(e) => setEditCapacity(parseInt(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(slot.id)}
                        disabled={submitting}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm"
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{formatDate(slot.date)}</p>
                      <p className="text-sm text-gray-600">{formatTime(slot.time)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {slot.remaining} / {slot.capacity} available
                      </p>
                      <p className="text-sm text-gray-600">
                        {slot.capacity - slot.remaining} sold
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEditing(slot)}
                        className="px-3 py-1 bg-[#004AAD] text-white rounded-lg hover:bg-[#003A8C] text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id)}
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
