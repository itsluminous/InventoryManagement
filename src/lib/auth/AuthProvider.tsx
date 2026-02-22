'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthState, useAuthActions } from '@/lib/hooks/useAuth';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<unknown>;
  signUp: (
    email: string,
    password: string,
    metadata?: { full_name?: string; business_name?: string }
  ) => Promise<unknown>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuth();
  const authActions = useAuthActions();
  const router = useRouter();

  // Handle session changes and redirects
  useEffect(() => {
    const { user, loading } = authState;

    // Don't redirect during initial loading
    if (loading) return;

    // Get current path
    const currentPath = window.location.pathname;
    const isAuthPage = ['/login', '/signup', '/reset-password'].includes(
      currentPath
    );

    // If user is authenticated and on auth page, redirect to home
    if (user && isAuthPage) {
      router.push('/');
    }
  }, [authState, router]);

  const value: AuthContextType = {
    ...authState,
    ...authActions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
