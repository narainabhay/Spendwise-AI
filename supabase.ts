import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Storage key for user-configured Supabase credentials
const STORAGE_KEY = 'spendwise_supabase_config';

export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read saved supabase config:', e);
  }

  return { url: '', anonKey: '' };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Reset client cache so new client is instantiated
    cachedClient = null;
  } catch (e) {
    console.error('Failed to save supabase config:', e);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    cachedClient = null;
  } catch (e) {
    console.error('Failed to clear supabase config:', e);
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Could not initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const config = getSavedSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Public Key are required.' };
  }

  try {
    const testClient = createClient(url, anonKey);
    // Ping profiles or basic endpoint
    const { error } = await testClient.from('profiles').select('id').limit(1);
    
    // Note: if table is empty or permission denied, connection succeeded if not a network failure
    if (error && error.code === 'PGRST301') {
      // Valid connection, standard auth check
      return { success: true, message: 'Connected to Supabase PostgreSQL successfully!' };
    }
    
    if (error && error.message?.includes('fetch')) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }

    return { success: true, message: 'Connection verified! Supabase database is reachable.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.' };
  }
}
