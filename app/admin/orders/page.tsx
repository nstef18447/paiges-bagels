'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { OrderWithDetails } from '@/types';
import AdminOrderCard from '@/components/AdminOrderCard';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'ready'>('pending');

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        time_slot:time_slots(*),
        order_items(*, bagel_type:bagel_types(*))
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as unknown as OrderWithDetails[]);
    }
    setLoading(false);
  };

  const handleConfirm = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchOrders();
      } else {
        alert('Failed to confirm order');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/ready`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchOrders();
      } else {
        alert('Failed to mark order ready');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchOrders();
      } else {
        alert('Failed to delete order');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const filteredOrders = orders.filter((order) => order.status === activeTab);

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
        <h1 className="text-4xl font-bold mb-4">Paige&apos;s Bagels - Admin</h1>
        <nav className="flex gap-4">
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:underline font-semibold"
          >
            Orders
          </Link>
          <Link
            href="/admin/slots"
            className="text-blue-600 hover:underline"
          >
            Time Slots
          </Link>
          <Link
            href="/admin/bagel-types"
            className="text-blue-600 hover:underline"
          >
            Bagel Types
          </Link>
        </nav>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({orders.filter((o) => o.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'confirmed'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Confirmed ({orders.filter((o) => o.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'ready'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ready ({orders.filter((o) => o.status === 'ready').length})
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <p className="text-gray-500 col-span-full">No {activeTab} orders</p>
        ) : (
          filteredOrders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              onConfirm={activeTab === 'pending' ? handleConfirm : undefined}
              onMarkReady={activeTab === 'confirmed' ? handleMarkReady : undefined}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
