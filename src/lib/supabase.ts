
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fallback to provided values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ietgplhyurvswlijjnfb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldGdwbGh5dXJ2c3dsaWpqbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MTQwMDUsImV4cCI6MjA1NjM5MDAwNX0.CsOh_ck-VBmHKiVmEFpYFzS7TG7wC2iA-kl9M7e6Y8E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email?: string;
  created_at?: string;
};
