
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
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

  async function signUp(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Проверка корректности email
      if (!email || !email.includes('@') || !email.includes('.')) {
        toast({
          title: 'Ошибка при регистрации',
          description: 'Пожалуйста, введите корректный email-адрес',
          variant: 'destructive',
        });
        return { success: false, message: 'Некорректный email-адрес' };
      }

      // Проверка пароля
      if (!password || password.length < 6) {
        toast({
          title: 'Ошибка при регистрации',
          description: 'Пароль должен содержать не менее 6 символов',
          variant: 'destructive',
        });
        return { success: false, message: 'Пароль должен содержать не менее 6 символов' };
      }

      console.log('Starting sign up process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      
      console.log('Sign up response:', { data, error });
      
      if (error) {
        console.error('Error in signUp:', error);
        toast({
          title: 'Ошибка при регистрации',
          description: error.message,
          variant: 'destructive',
        });
        return { success: false, message: error.message };
      }
      
      // Проверка, нужно ли подтверждение по email
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast({
          title: 'Пользователь уже существует',
          description: 'Этот email уже зарегистрирован. Попробуйте войти или восстановить пароль.',
          variant: 'destructive',
        });
        return { success: false, message: 'Этот email уже зарегистрирован' };
      }
      
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: 'Почти готово!',
          description: 'Пожалуйста, проверьте вашу электронную почту для подтверждения регистрации',
        });
        return { success: true, message: 'Проверьте вашу электронную почту' };
      }
      
      toast({
        title: 'Регистрация успешна',
        description: 'Вы успешно зарегистрировались в системе',
      });
      return { success: true, message: 'Регистрация успешна' };
    } catch (error) {
      console.error('Unexpected error during signUp:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла непредвиденная ошибка при регистрации',
        variant: 'destructive',
      });
      return { success: false, message: 'Произошла непредвиденная ошибка' };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      console.log('Starting sign in process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Sign in response:', { data, error });
      
      if (error) {
        console.error('Error in signIn:', error);
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
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error in signOut:', error);
        toast({
          title: 'Ошибка при выходе',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
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
