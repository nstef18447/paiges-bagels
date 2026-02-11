'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { OrderWithDetails } from '@/types';
import AdminOrderCard from '@/components/AdminOrderCard';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'completed'>('pending');

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
        order_items(*, bagel_type:bagel_types(*)),
        order_add_ons(*, add_on_type:add_on_types(*))
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

  const handleToggleFake = async (orderId: string, isFake: boolean, currentPrice: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_fake: isFake, original_price: currentPrice }),
      });

      if (response.ok) {
        fetchOrders();
      } else {
        alert('Failed to update order');
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

  const filteredOrders = orders.filter((order) =>
    activeTab === 'completed' ? order.status === 'ready' : order.status === activeTab
  );

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
          <Link href="/admin/orders" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Orders</Link>
          <Link href="/admin/slots" className="hover:underline" style={{ color: '#004AAD' }}>Time Slots</Link>
          <Link href="/admin/bagel-types" className="hover:underline" style={{ color: '#004AAD' }}>Bagel Types</Link>
          <Link href="/admin/add-ons" className="hover:underline" style={{ color: '#004AAD' }}>Add-Ons</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
          <Link href="/admin/prep" className="hover:underline" style={{ color: '#004AAD' }}>Prep</Link>
        </nav>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({orders.filter((o) => o.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'confirmed'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Confirmed ({orders.filter((o) => o.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'completed'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({orders.filter((o) => o.status === 'ready').length})
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <p className="text-gray-500 col-span-full">No {activeTab === 'completed' ? 'completed' : activeTab} orders</p>
        ) : (
          filteredOrders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              onConfirm={activeTab === 'pending' ? handleConfirm : undefined}
              onMarkReady={activeTab === 'confirmed' ? handleMarkReady : undefined}
              onDelete={handleDelete}
              onToggleFake={handleToggleFake}
            />
          ))
        )}
      </div>
    </div>
  );
}
