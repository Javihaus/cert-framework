import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DashboardLayout from '@/components/DashboardLayout';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

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
      <body className={inter.className}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
