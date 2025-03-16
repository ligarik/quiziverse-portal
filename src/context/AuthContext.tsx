
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function getInitialSession() {
      try {
        setLoading(true);
        
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
        }
        
        setSession(session);
        setUser(session?.user ? { id: session.user.id, email: session.user.email } as User : null);
      } catch (error) {
        console.error('Unexpected error during getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ? { id: session.user.id, email: session.user.email } as User : null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: 'Ошибка при регистрации',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Регистрация успешна',
        description: 'Пожалуйста, проверьте вашу электронную почту для подтверждения регистрации',
      });
    } catch (error) {
      console.error('Unexpected error during signUp:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла непредвиденная ошибка при регистрации',
        variant: 'destructive',
      });
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: 'Ошибка при входе',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Вход выполнен успешно',
        description: 'Добро пожаловать в QuizCraft',
      });
    } catch (error) {
      console.error('Unexpected error during signIn:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла непредвиденная ошибка при входе',
        variant: 'destructive',
      });
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Выход выполнен',
        description: 'Вы успешно вышли из системы',
      });
    } catch (error) {
      console.error('Unexpected error during signOut:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла непредвиденная ошибка при выходе',
        variant: 'destructive',
      });
    }
  }

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
