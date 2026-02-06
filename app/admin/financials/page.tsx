'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DailyFinancials } from '@/types';

interface FinancialsData {
  daily: DailyFinancials[];
  summary: {
    total_revenue: number;
    total_cogs: number;
    total_profit: number;
    total_orders: number;
    total_bagels: number;
    avg_order_value: number;
    overall_margin: number;
  };
  cost_per_bagel: number;
}

export default function AdminFinancialsPage() {
  const [data, setData] = useState<FinancialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);

      const url = `/api/financials${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchFinancials(startDate || undefined, endDate || undefined);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchFinancials();
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const summary = data?.summary;
  const daily = data?.daily || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
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
          <Link href="/admin/add-ons" className="hover:underline" style={{ color: '#004AAD' }}>Add-Ons</Link>
          <Link href="/admin/pricing" className="hover:underline" style={{ color: '#004AAD' }}>Pricing</Link>
          <Link href="/admin/costs" className="hover:underline" style={{ color: '#004AAD' }}>Costs</Link>
          <Link href="/admin/financials" className="hover:underline font-semibold" style={{ color: '#004AAD' }}>Financials</Link>
        </nav>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">{fmt(summary.total_revenue)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total COGS</div>
            <div className="text-2xl font-bold text-red-600">{fmt(summary.total_cogs)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Profit</div>
            <div className="text-2xl font-bold text-[#004AAD]">{fmt(summary.total_profit)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Orders</div>
            <div className="text-2xl font-bold">{summary.total_orders}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Avg Order Value</div>
            <div className="text-2xl font-bold">{fmt(summary.avg_order_value)}</div>
          </div>
        </div>
      )}

      {/* Cost per Bagel */}
      {data && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg inline-block">
          <span className="text-sm text-blue-800 font-medium">
            Cost per Bagel: <strong>${data.cost_per_bagel.toFixed(4)}</strong>
          </span>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFilter}
            disabled={loading}
            className="px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003A8C] disabled:bg-gray-300 transition-colors"
          >
            {loading ? 'Loading...' : 'Filter'}
          </button>
          {(startDate || endDate) && (
            <button
              onClick={handleClearFilter}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Daily Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Date</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Orders</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Bagels Sold</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Revenue</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">COGS</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Profit</th>
                <th className="py-3 px-2 font-semibold text-sm text-gray-600">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((day) => (
                <tr key={day.date} className="border-b border-gray-100">
                  <td className="py-2 px-2 font-medium">{day.date}</td>
                  <td className="py-2 px-2">{day.orders}</td>
                  <td className="py-2 px-2">{day.bagels_sold}</td>
                  <td className="py-2 px-2 text-green-600">{fmt(day.revenue)}</td>
                  <td className="py-2 px-2 text-red-600">{fmt(day.cogs)}</td>
                  <td className="py-2 px-2 text-[#004AAD] font-medium">{fmt(day.profit)}</td>
                  <td className="py-2 px-2">{day.profit_margin.toFixed(1)}%</td>
                </tr>
              ))}
              {daily.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No financial data found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
