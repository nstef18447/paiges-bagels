'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AddOnType } from '@/types';
import AddOnTypeManager from '@/components/AddOnTypeManager';

export default function AdminAddOnsPage() {
  const [addOnTypes, setAddOnTypes] = useState<AddOnType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddOnTypes();
  }, []);

  const fetchAddOnTypes = async () => {
    try {
      const response = await fetch('/api/add-on-types');
      const data = await response.json();
      setAddOnTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch add-on types:', err);
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
        <div className="mb-4">
          <Link href="/admin/orders">
            <Image src="/logo.png" alt="Paige's Bagels" width={200} height={80} priority />
          </Link>
        </div>
        <nav className="flex gap-4">
          <Link href="/admin/orders" className="hover:underline" style={{ color: '#004AAD' }}>Orders</Link>
          <Link href="/admin/slots" className="hover:underline" style={{ color: '#004AAD' }}>Time Slots</Link>
          <Link href="/admin/bagel-types" className="hover:underline" style={{ color: '#004AAD' }}>Bagel Types</Link>
          <Link href="/admin/add-ons" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Add-Ons</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
        </nav>
      </div>

      <AddOnTypeManager addOnTypes={addOnTypes} onRefresh={fetchAddOnTypes} />
    </div>
  );
}
