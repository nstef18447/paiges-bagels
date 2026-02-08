'use client';

import { OrderWithDetails } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface AdminOrderCardProps {
  order: OrderWithDetails;
  onConfirm?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  onToggleFake?: (orderId: string, isFake: boolean, currentPrice: number) => void;
}

export default function AdminOrderCard({ order, onConfirm, onMarkReady, onDelete, onToggleFake }: AdminOrderCardProps) {
  // Get bagel list from order_items if available, otherwise fallback to old columns
  const bagelList = order.order_items && order.order_items.length > 0
    ? order.order_items.map(item => `${item.quantity} ${item.bagel_type.name}`)
    : [
        order.plain_count > 0 && `${order.plain_count} Plain`,
        order.everything_count > 0 && `${order.everything_count} Everything`,
        order.sesame_count > 0 && `${order.sesame_count} Sesame`,
      ].filter(Boolean);

  return (
    <div
      className="rounded-lg p-4 shadow-sm"
      style={{
        backgroundColor: order.is_fake ? '#FFF7ED' : '#FFFFFF',
        border: order.is_fake ? '2px solid #F59E0B' : '1px solid #E5E7EB',
      }}
    >
      {order.is_fake && (
        <div className="mb-2 px-2 py-1 rounded text-xs font-bold text-center" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
          FAKE ORDER — Holding capacity, $0 revenue
        </div>
      )}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{order.customer_name}</h3>
          <p className="text-sm text-gray-600">{order.customer_email}</p>
          <p className="text-sm text-gray-600">{order.customer_phone}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl">${order.total_price.toFixed(2)}</p>
          <p className="text-sm text-gray-600">
            {formatDate(order.time_slot.date)}
          </p>
          <p className="text-sm text-gray-600">{formatTime(order.time_slot.time)}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Bagels:</p>
        <ul className="text-sm text-gray-600">
          {bagelList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {order.order_add_ons && order.order_add_ons.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Add-Ons:</p>
          <ul className="text-sm text-gray-600">
            {order.order_add_ons.map((addOn, i) => (
              <li key={i}>{addOn.quantity} {addOn.add_on_type.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3 p-2 bg-gray-50 rounded">
        <p className="text-xs text-gray-600">
          Venmo Note: <code className="bg-white px-2 py-1 rounded">{order.venmo_note}</code>
        </p>
      </div>

      {order.status === 'pending' && onConfirm && (
        <button
          onClick={() => onConfirm(order.id)}
          className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
        >
          Confirm Payment
        </button>
      )}

      {order.status === 'confirmed' && onMarkReady && (
        <button
          onClick={() => onMarkReady(order.id)}
          className="w-full py-2 px-4 bg-[#004AAD] text-white font-semibold rounded-lg hover:bg-[#003A8C] transition-colors"
        >
          Mark Ready for Pickup
        </button>
      )}

      {order.status === 'ready' && (
        <div className="w-full py-2 px-4 bg-green-100 text-green-700 font-semibold rounded-lg text-center">
          Completed
        </div>
      )}

      {onToggleFake && (
        <button
          onClick={() => onToggleFake(order.id, !order.is_fake, order.total_price)}
          className="w-full mt-2 py-2 px-4 font-semibold rounded-lg transition-colors"
          style={{
            backgroundColor: order.is_fake ? '#D1D5DB' : '#F59E0B',
            color: order.is_fake ? '#374151' : '#FFFFFF',
          }}
        >
          {order.is_fake ? 'Unmark as Fake' : 'Mark as Fake'}
        </button>
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(order.id)}
          className="w-full mt-2 py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
        >
          Delete Order
        </button>
      )}
    </div>
  );
}
