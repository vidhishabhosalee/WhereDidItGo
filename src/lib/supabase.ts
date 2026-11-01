import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && key);

// A placeholder URL keeps the app rendering (with a setup notice) until the .env file is filled in.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key');
