'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type LapsedCustomer = {
  customer_name: string;
  customer_email: string;
  last_order_date: string;
  order_count: number;
  weeks_ago: number;
};

type NeverOrderedCustomer = {
  email: string;
  customer_name: string | null;
  created_at: string;
};

type Tab = '4weeks' | '8weeks' | 'never';

function weeksAgo(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
}

function formatWeeksAgo(weeks: number): string {
  if (weeks === 0) return 'This week';
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

export default function LapsedCustomersPage() {
  const [lapsed, setLapsed] = useState<LapsedCustomer[]>([]);
  const [neverOrdered, setNeverOrdered] = useState<NeverOrderedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('4weeks');

  useEffect(() => {
    async function fetchData() {
      const [ordersResult, subscribersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('customer_name, customer_email, time_slot:time_slots(date)')
          .eq('status', 'ready'),
        supabase
          .from('subscribers')
          .select('email, customer_name, created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (ordersResult.data) {
        const byEmail = new Map<string, { name: string; lastDate: string; count: number }>();
        for (const order of ordersResult.data as unknown as {
          customer_name: string;
          customer_email: string;
          time_slot: { date: string };
        }[]) {
          const email = order.customer_email.toLowerCase();
          const date = order.time_slot?.date ?? '';
          const existing = byEmail.get(email);
          if (!existing || date > existing.lastDate) {
            byEmail.set(email, {
              name: order.customer_name,
              lastDate: date,
              count: (existing?.count ?? 0) + 1,
            });
          } else {
            existing.count += 1;
          }
        }

        const customers: LapsedCustomer[] = Array.from(byEmail.entries()).map(
          ([email, { name, lastDate, count }]) => ({
            customer_email: email,
            customer_name: name,
            last_order_date: lastDate,
            order_count: count,
            weeks_ago: weeksAgo(lastDate),
          })
        );
        customers.sort((a, b) => b.weeks_ago - a.weeks_ago);
        setLapsed(customers);
      }

      if (subscribersResult.data && ordersResult.data) {
        const orderedEmails = new Set(
          (
            ordersResult.data as unknown as { customer_email: string }[]
          ).map((o) => o.customer_email.toLowerCase())
        );
        const never = subscribersResult.data.filter(
          (s) => !orderedEmails.has(s.email.toLowerCase())
        );
        setNeverOrdered(never as NeverOrderedCustomer[]);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const filtered4 = lapsed.filter((c) => c.weeks_ago >= 4);
  const filtered8 = lapsed.filter((c) => c.weeks_ago >= 8);

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
        <nav className="flex gap-4 flex-wrap">
          <Link href="/admin/orders" className="hover:underline" style={{ color: '#004AAD' }}>Orders</Link>
          <Link href="/admin/slots" className="hover:underline" style={{ color: '#004AAD' }}>Time Slots</Link>
          <Link href="/admin/bagel-types" className="hover:underline" style={{ color: '#004AAD' }}>Bagel Types</Link>
          <Link href="/admin/add-ons" className="hover:underline" style={{ color: '#004AAD' }}>Add-Ons</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline" style={{ color: '#004AAD' }}>Financials</Link>
          <Link href="/admin/prep" className="hover:underline" style={{ color: '#004AAD' }}>Prep</Link>
          <Link href="/admin/merch" className="hover:underline" style={{ color: '#004AAD' }}>Merch</Link>
          <Link href="/admin/recipe" className="hover:underline" style={{ color: '#004AAD' }}>Recipe</Link>
          <Link href="/admin/lapsed" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Lapsed</Link>
        </nav>
      </div>

      <h1 className="text-2xl font-bold mb-6">Lapsed Customers</h1>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('4weeks')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === '4weeks'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          4+ weeks ({filtered4.length})
        </button>
        <button
          onClick={() => setActiveTab('8weeks')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === '8weeks'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          8+ weeks ({filtered8.length})
        </button>
        <button
          onClick={() => setActiveTab('never')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'never'
              ? 'border-b-2 border-[#004AAD] text-[#004AAD]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Never ordered ({neverOrdered.length})
        </button>
      </div>

      {activeTab === 'never' ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Subscribers who signed up but have never placed an order.
          </p>
          {neverOrdered.length === 0 ? (
            <p className="text-gray-500">No subscribers without orders.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="py-2 pr-6">Subscriber</th>
                    <th className="py-2 pr-6">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {neverOrdered.map((s) => (
                    <tr key={s.email} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 pr-6">
                        {s.customer_name && (
                          <div className="font-medium">{s.customer_name}</div>
                        )}
                        <div className="text-gray-500">{s.email}</div>
                      </td>
                      <td className="py-2 pr-6 text-gray-600 whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {activeTab === '4weeks'
              ? `${filtered4.length} customer${filtered4.length !== 1 ? 's' : ''} who haven't ordered in 4+ weeks, sorted by most lapsed.`
              : `${filtered8.length} customer${filtered8.length !== 1 ? 's' : ''} who haven't ordered in 8+ weeks, sorted by most lapsed.`}
          </p>
          {(activeTab === '4weeks' ? filtered4 : filtered8).length === 0 ? (
            <p className="text-gray-500">No lapsed customers in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="py-2 pr-6">Customer</th>
                    <th className="py-2 pr-6">Last order</th>
                    <th className="py-2 pr-6">Total orders</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === '4weeks' ? filtered4 : filtered8).map((c) => (
                    <tr key={c.customer_email} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 pr-6">
                        <div className="font-medium">{c.customer_name}</div>
                        <div className="text-gray-500 text-xs">{c.customer_email}</div>
                      </td>
                      <td className="py-2 pr-6 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            c.weeks_ago >= 12
                              ? 'bg-red-100 text-red-700'
                              : c.weeks_ago >= 8
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {formatWeeksAgo(c.weeks_ago)}
                        </span>
                      </td>
                      <td className="py-2 pr-6 text-gray-700">{c.order_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
