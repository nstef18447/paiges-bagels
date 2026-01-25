'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Order, TimeSlot } from '@/types';
import { formatDate, formatTime, generateVenmoLink } from '@/lib/utils';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderData) {
        setOrder(orderData);

        const { data: slotData } = await supabase
          .from('time_slots')
          .select('*')
          .eq('id', orderData.time_slot_id)
          .single();

        setTimeSlot(slotData);
      }

      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!order || !timeSlot) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600">Order not found</h1>
      </div>
    );
  }

  const venmoUsername = process.env.NEXT_PUBLIC_VENMO_USERNAME || 'paiges-bagels';
  const venmoLink = generateVenmoLink(venmoUsername, order.total_price, order.venmo_note);

  const bagelList = [];
  if (order.plain_count > 0) bagelList.push(`${order.plain_count} Plain`);
  if (order.everything_count > 0) bagelList.push(`${order.everything_count} Everything`);
  if (order.sesame_count > 0) bagelList.push(`${order.sesame_count} Sesame`);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Paige's Bagels"
          width={350}
          height={350}
          className="mb-6"
        />
        <h1 className="text-3xl font-bold mb-2 text-green-600">Order Placed!</h1>
        <p className="text-gray-600">Thank you for your order</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Pickup Time</p>
            <p className="font-semibold">
              {formatDate(timeSlot.date)} at {formatTime(timeSlot.time)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Your Bagels</p>
            <ul className="font-semibold">
              {bagelList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">${order.total_price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>

        <ol className="space-y-3 list-decimal list-inside">
          <li className="font-medium">
            Pay via Venmo
            <p className="text-sm text-gray-600 ml-6 mt-1">
              Use the button below to pay ${order.total_price.toFixed(2)}
            </p>
          </li>
          <li className="font-medium">
            Wait for confirmation email
            <p className="text-sm text-gray-600 ml-6 mt-1">
              We&apos;ll send a confirmation to {order.customer_email} once payment is verified
            </p>
          </li>
          <li className="font-medium">
            Pick up your bagels
            <p className="text-sm text-gray-600 ml-6 mt-1">
              You&apos;ll receive another email when your order is ready for pickup
            </p>
          </li>
        </ol>
      </div>

      <a
        href={venmoLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-4 px-6 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors text-center"
      >
        Pay ${order.total_price.toFixed(2)} on Venmo
      </a>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Important:</strong> Your payment note is <code className="bg-white px-2 py-1 rounded">{order.venmo_note}</code>
          <br />
          This will be automatically included when you use the button above.
        </p>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
