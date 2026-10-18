import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { DEMO_USER } from '../lib/constants';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchToDemoMode: () => void;
  switchToLiveMode: () => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'spendwise_user_profile';
const LOCAL_STORAGE_MODE_KEY = 'spendwise_active_mode'; // 'demo' | 'live'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      const savedMode = localStorage.getItem(LOCAL_STORAGE_MODE_KEY);
      const supabase = getSupabaseClient();

      if (savedMode === 'live' && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile);
            } else {
              // Fallback user from session
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'SpendWise User',
                currency: 'INR',
                opening_balance: 0,
                theme: 'dark',
                date_format: 'YYYY-MM-DD',
                created_at: new Date().toISOString(),
              });
            }
            setIsDemoMode(false);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        }
      }

      // Default to Demo mode with persisted local user profile
      const savedUserStr = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (savedUserStr) {
        try {
          setUser(JSON.parse(savedUserStr));
        } catch {
          setUser(DEMO_USER);
        }
      } else {
        setUser(DEMO_USER);
      }
      setIsDemoMode(true);
      setIsLoading(false);
    }

    initAuth();

    // Listen to Supabase auth changes
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile);
          }
          setIsDemoMode(false);
          localStorage.setItem(LOCAL_STORAGE_MODE_KEY, 'live');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // If Supabase is not configured, inform the user
      return {
        success: false,
        error: 'Supabase database is not configured yet. You can use Demo Mode immediately or configure Supabase in Settings.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setUser(profile);
        } else {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || 'SpendWise User',
            currency: 'INR',
            opening_balance: 0,
            theme: 'dark',
            date_format: 'YYYY-MM-DD',
            created_at: new Date().toISOString(),
          });
        }
        setIsDemoMode(false);
        localStorage.setItem(LOCAL_STORAGE_MODE_KEY, 'live');
        return { success: true };
      }
      return { success: false, error: 'User session not created.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase database is not configured. Please enter your project keys in Settings or continue using Demo Mode.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create initial profile in profiles table
        const newProfile: UserProfile = {
          id: data.user.id,
          email,
          full_name: fullName,
          currency: 'INR',
          opening_balance: 0,
          theme: 'dark',
          date_format: 'YYYY-MM-DD',
          created_at: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert(newProfile);
        } catch (e) {
          console.warn('Profile upsert note:', e);
        }

        setUser(newProfile);
        setIsDemoMode(false);
        localStorage.setItem(LOCAL_STORAGE_MODE_KEY, 'live');
        return { success: true };
      }
      return { success: false, error: 'Sign up failed.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sign up failed' };
    }
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (supabase && !isDemoMode) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Supabase signout error:', e);
      }
    }

    // Switch back to demo user
    setUser(DEMO_USER);
    setIsDemoMode(true);
    localStorage.setItem(LOCAL_STORAGE_MODE_KEY, 'demo');
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    if (isDemoMode) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
    } else {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      }
    }
  };

  const switchToDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem(LOCAL_STORAGE_MODE_KEY, 'demo');
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    setUser(saved ? JSON.parse(saved) : DEMO_USER);
  };

  const switchToLiveMode = () => {
    setIsDemoMode(false);
    localStorage.setItem(LOCAL_STORAGE_MODE_KEY, 'live');
  };

  const resetDemoData = () => {
    localStorage.removeItem('spendwise_demo_transactions');
    localStorage.removeItem('spendwise_demo_budgets');
    localStorage.removeItem('spendwise_demo_goals');
    localStorage.removeItem('spendwise_demo_recurring');
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setUser(DEMO_USER);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isDemoMode ? true : !!user,
        isDemoMode,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        switchToDemoMode,
        switchToLiveMode,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
