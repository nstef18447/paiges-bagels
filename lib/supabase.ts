import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that need elevated privileges
export function getServiceSupabase() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
