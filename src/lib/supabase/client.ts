import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when env vars are missing, return a mock client
    console.warn(
      'Supabase environment variables are missing. Using mock client.'
    );
    return null as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};
