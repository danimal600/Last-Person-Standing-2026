import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vclejmjjauxejxsazpob.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGVqbWpqYXV4ZWp4c2F6cG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzcyNTksImV4cCI6MjA5NjA1MzI1OX0.Bo_vfIFwZZaW05touWAyLIcDLG9ItpsQBUFWw5MA6i4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
