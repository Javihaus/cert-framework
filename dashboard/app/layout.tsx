import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata: Metadata = {
  title: 'CERT Dashboard - EU AI Act Compliance',
  description: 'Professional EU AI Act Article 15 Compliance Monitoring Dashboard',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
