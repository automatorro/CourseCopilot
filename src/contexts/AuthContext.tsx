import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Plan } from '../types';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
      // Only block UI during initial session resolution
      if (!initialized && event === 'INITIAL_SESSION') {
        setLoading(true);
      }
      try {
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            setUser(null);
          } else {
            const rawPlan = profile?.plan;
            // Validate that the plan from DB actually exists in our Plan enum
            const isValidPlan = Object.values(Plan).includes(rawPlan as Plan);
            
            if (!isValidPlan && rawPlan) {
                console.warn(`[AuthContext] Invalid plan found in profile: "${rawPlan}". Falling back to ${Plan.Trial}.`);
            }

            const userPlan = isValidPlan ? (rawPlan as Plan) : Plan.Trial;
            const userRole = (profile?.role as 'admin' | 'user') || 'user';
            const fullUser: User = {
              ...session.user,
              plan: userPlan,
              role: userRole,
              first_name: profile?.first_name,
              last_name: profile?.last_name,
            };
            setUser(fullUser);
          }
        } else {
          setUser(null);
        }
      } finally {
        if (!initialized && event === 'INITIAL_SESSION') {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange('INITIAL_SESSION', session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Do not block UI on subsequent auth events (e.g., token refresh, tab focus)
      handleAuthStateChange(event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
