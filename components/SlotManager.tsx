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
  const [timeEntries, setTimeEntries] = useState<Array<{ time: string; capacity: number }>>([
    { time: '', capacity: 12 },
  ]);
  const [cutoffDate, setCutoffDate] = useState('');
  const [cutoffTime, setCutoffTime] = useState('');
  const [isHangover, setIsHangover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCapacity, setEditCapacity] = useState(12);
  const [editCutoffDate, setEditCutoffDate] = useState('');
  const [editCutoffTime, setEditCutoffTime] = useState('');
  const [editIsHangover, setEditIsHangover] = useState(false);
  const [slotTab, setSlotTab] = useState<'active' | 'past'>('active');

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const isPastSlot = (slot: TimeSlotWithCapacity) => {
    return slot.date < today || (slot.total_orders > 0 && slot.active_orders === 0);
  };

  const activeSlots = slots.filter((slot) => !isPastSlot(slot));
  const pastSlots = slots.filter((slot) => isPastSlot(slot));
  const displayedSlots = slotTab === 'active' ? activeSlots : pastSlots;

  const addTimeEntry = () => {
    setTimeEntries([...timeEntries, { time: '', capacity: 12 }]);
  };

  const removeTimeEntry = (index: number) => {
    if (timeEntries.length <= 1) return;
    setTimeEntries(timeEntries.filter((_, i) => i !== index));
  };

  const updateTimeEntry = (index: number, field: 'time' | 'capacity', value: string | number) => {
    const updated = [...timeEntries];
    if (field === 'time') {
      updated[index].time = value as string;
    } else {
      updated[index].capacity = value as number;
    }
    setTimeEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Combine cutoff date and time into ISO string if both provided
    const cutoff_time = cutoffDate && cutoffTime
      ? new Date(`${cutoffDate}T${cutoffTime}`).toISOString()
      : null;

    try {
      const results = await Promise.all(
        timeEntries.map((entry) =>
          fetch('/api/slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              time: entry.time,
              capacity: entry.capacity,
              cutoff_time,
              is_hangover: isHangover,
            }),
          })
        )
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        alert(`${failed.length} of ${results.length} time slots failed to create`);
      }

      setDate('');
      setTimeEntries([{ time: '', capacity: 12 }]);
      setCutoffDate('');
      setCutoffTime('');
      setIsHangover(false);
      setShowForm(false);
      onRefresh();
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    setSubmitting(true);

    // Combine cutoff date and time into ISO string if both provided
    const cutoff_time = editCutoffDate && editCutoffTime
      ? new Date(`${editCutoffDate}T${editCutoffTime}`).toISOString()
      : null;

    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editDate,
          time: editTime,
          capacity: editCapacity,
          cutoff_time,
          is_hangover: editIsHangover,
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
    setEditIsHangover(slot.is_hangover || false);
    if (slot.cutoff_time) {
      const cutoff = new Date(slot.cutoff_time);
      setEditCutoffDate(cutoff.toISOString().split('T')[0]);
      setEditCutoffTime(cutoff.toTimeString().slice(0, 5));
    } else {
      setEditCutoffDate('');
      setEditCutoffTime('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDate('');
    setEditTime('');
    setEditCapacity(12);
    setEditCutoffDate('');
    setEditCutoffTime('');
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
          <h3 className="font-semibold mb-4">Create New Time Slots</h3>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Times
              </label>
              <div className="space-y-2">
                {timeEntries.map((entry, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={entry.time}
                      onChange={(e) => updateTimeEntry(index, 'time', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      value={entry.capacity}
                      onChange={(e) => updateTimeEntry(index, 'capacity', parseInt(e.target.value))}
                      min="1"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
                      placeholder="Capacity"
                      required
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">bagels</span>
                    {timeEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeEntry(index)}
                        className="px-2 py-2 text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTimeEntry}
                className="mt-2 text-sm text-[#004AAD] hover:text-[#003A8C] font-medium"
              >
                + Add another time
              </button>
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Order Cutoff (optional)</p>
              <p className="text-xs text-gray-500 mb-3">Orders will be disabled after this time</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cutoffDate" className="block text-xs text-gray-600 mb-1">
                    Cutoff Date
                  </label>
                  <input
                    type="date"
                    id="cutoffDate"
                    value={cutoffDate}
                    onChange={(e) => setCutoffDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cutoffTime" className="block text-xs text-gray-600 mb-1">
                    Cutoff Time
                  </label>
                  <input
                    type="time"
                    id="cutoffTime"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHangover}
                  onChange={(e) => setIsHangover(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Hangover Bagels slot</span>
                  <p className="text-xs text-gray-500">Shows on /hangover page for same-day impulse orders</p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            >
              {submitting
                ? 'Creating...'
                : timeEntries.length === 1
                  ? 'Create Time Slot'
                  : `Create ${timeEntries.length} Time Slots`}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setSlotTab('active')}
            className={`px-4 py-2 font-semibold transition-colors ${
              slotTab === 'active'
                ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({activeSlots.length})
          </button>
          <button
            onClick={() => setSlotTab('past')}
            className={`px-4 py-2 font-semibold transition-colors ${
              slotTab === 'past'
                ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past ({pastSlots.length})
          </button>
        </div>

        {displayedSlots.length === 0 ? (
          <p className="text-gray-500">
            {slotTab === 'active' ? 'No active time slots' : 'No past time slots'}
          </p>
        ) : (
          <div className="grid gap-3">
            {displayedSlots.map((slot) => (
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cutoff Date</label>
                        <input
                          type="date"
                          value={editCutoffDate}
                          onChange={(e) => setEditCutoffDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cutoff Time</label>
                        <input
                          type="time"
                          value={editCutoffTime}
                          onChange={(e) => setEditCutoffTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsHangover}
                        onChange={(e) => setEditIsHangover(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Hangover Bagels slot</span>
                    </label>
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
                      <p className="font-semibold">
                        {formatDate(slot.date)}
                        {slot.is_hangover && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                            Hangover
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{formatTime(slot.time)}</p>
                      {slot.cutoff_time && (
                        <p className="text-xs text-orange-600 mt-1">
                          Orders close: {new Date(slot.cutoff_time).toLocaleString()}
                        </p>
                      )}
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
