/**
 * Used only for credential-free demo builds. The real Supabase client is never
 * constructed in that mode, so Vite swaps this tiny stub in to keep
 * @supabase/supabase-js out of the demo bundle.
 */
export function createClient(): never {
  throw new Error('Supabase is disabled in this local demo build.');
}
