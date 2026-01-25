export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  created_at: string;
}

export interface TimeSlotWithCapacity extends TimeSlot {
  remaining: number;
}

export interface BagelType {
  id: string;
  name: string;
  active: boolean;
  display_order: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  bagel_type_id: string;
  quantity: number;
  created_at: string;
}

export interface OrderItemWithType extends OrderItem {
  bagel_type: BagelType;
}

export interface Order {
  id: string;
  time_slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  plain_count: number;
  everything_count: number;
  sesame_count: number;
  total_bagels: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'ready';
  venmo_note: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  time_slot: TimeSlot;
  order_items: OrderItemWithType[];
}

export interface OrderWithSlot extends Order {
  time_slot: TimeSlot;
}

export interface BagelCounts {
  [bagelTypeId: string]: number;
}

export interface OrderFormData {
  timeSlotId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bagelCounts: BagelCounts;
}
