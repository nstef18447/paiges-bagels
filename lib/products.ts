import { supabase } from './supabase';
import { MerchItem } from '@/types';

export async function getProductById(id: string): Promise<MerchItem | null> {
  const { data, error } = await supabase
    .from('merch_items')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error || !data) return null;
  return data as MerchItem;
}
