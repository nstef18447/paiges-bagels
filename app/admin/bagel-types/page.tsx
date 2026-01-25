'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BagelType } from '@/types';
import BagelTypeManager from '@/components/BagelTypeManager';

export default function AdminBagelTypesPage() {
  const [bagelTypes, setBagelTypes] = useState<BagelType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBagelTypes();
  }, []);

  const fetchBagelTypes = async () => {
    try {
      const response = await fetch('/api/bagel-types');
      const data = await response.json();
      setBagelTypes(data);
    } catch (err) {
      console.error('Failed to fetch bagel types:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Paige&apos;s Bagels - Admin</h1>
        <nav className="flex gap-4">
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:underline"
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
            className="text-blue-600 hover:underline font-semibold"
          >
            Bagel Types
          </Link>
        </nav>
      </div>

      <BagelTypeManager bagelTypes={bagelTypes} onRefresh={fetchBagelTypes} />
    </div>
  );
}
