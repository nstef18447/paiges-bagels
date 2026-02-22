export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  cutoff_time: string | null;
  is_hangover: boolean;
  created_at: string;
}

export interface TimeSlotWithCapacity extends TimeSlot {
  remaining: number;
  total_orders: number;
  active_orders: number;
}

export interface BagelType {
  id: string;
  name: string;
  active: boolean;
  display_order: number;
  image_url: string | null;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
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
  is_fake: boolean;
  venmo_note: string;
  created_at: string;
  updated_at: string;
}

export interface AddOnType {
  id: string;
  name: string;
  price: number;
  active: boolean;
  display_order: number;
  created_at: string;
}

export interface OrderAddOn {
  id: string;
  order_id: string;
  add_on_type_id: string;
  quantity: number;
  created_at: string;
}

export interface OrderAddOnWithType extends OrderAddOn {
  add_on_type: AddOnType;
}

export interface AddOnCounts {
  [addOnTypeId: string]: number;
}

export interface OrderWithDetails extends Order {
  time_slot: TimeSlot;
  order_items: OrderItemWithType[];
  order_add_ons?: OrderAddOnWithType[];
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
  addOnCounts: AddOnCounts;
}

export interface Pricing {
  id: string;
  bagel_quantity: number;
  price: number;
  label?: string;
  pricing_type?: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  units_per_bagel: number;
  cost_type: 'per_bagel' | 'per_addon' | 'fixed';
  add_on_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyFinancials {
  date: string;
  orders: number;
  bagels_sold: number;
  revenue: number;
  cogs: number;
  profit: number;
  profit_margin: number;
}

// Merch types
export interface MerchItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  image_url: string | null;
  needs_size: boolean;
  sizes: string[];
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MerchSettings {
  id: string;
  shipping_cost: number;
  updated_at: string;
}

export interface MerchOrderItem {
  id: string;
  name: string;
  size: string | null;
  quantity: number;
  unit_price: number;
}

export interface MerchOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  items: MerchOrderItem[];
  shipping_cost: number;
  total_price: number;
  status: 'pending_payment' | 'paid' | 'shipped' | 'cancelled';
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}
