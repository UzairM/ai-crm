import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, AuthResponse } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    set({ user: data.user, loading: false });
  },
  signUp: async (email, password) => {
    const response = await supabase.auth.signUp({
      email,
      password,
    });
    if (response.error) throw response.error;
    set({ user: response.data.user });
    return response;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, loading: false });
  },
  setUser: (user) => set({ user, loading: false }),
}));