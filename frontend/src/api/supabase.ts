import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};
