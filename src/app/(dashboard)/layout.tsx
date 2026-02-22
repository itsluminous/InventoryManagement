'use client';

import { ReactNode } from 'react';
import { AppShell } from '@/components/layout';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
