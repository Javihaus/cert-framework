'use client';

import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Application Providers
 * Includes authentication and other global context providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
