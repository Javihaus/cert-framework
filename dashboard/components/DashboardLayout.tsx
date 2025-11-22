'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayCircleIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/', icon: HomeIcon },
  { name: 'Live Monitoring', href: '/monitoring', icon: PlayCircleIcon, badge: 'LIVE', badgeColor: 'bg-green-500' },
  { name: 'Compliance Center', href: '/compliance', icon: ShieldCheckIcon, badge: '3', badgeColor: 'bg-orange-500' },
  { name: 'Assessment', href: '/assessment', icon: DocumentTextIcon },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const complianceScore = 85;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Mobile menu backdrop */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-gray-900 to-gray-800 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } hidden lg:block`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                <Image
                  src="/cert-logo.png"
                  alt="CERT Framework"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl font-bold text-white"
                >
                  CERT
                </motion.span>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {sidebarOpen ? (
                <ChevronLeftIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Compliance Score */}
          {sidebarOpen && (
            <div className="p-4 border-b border-gray-700">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Compliance Score</span>
                  <span className={`text-sm font-medium ${complianceScore >= 90 ? 'text-green-400' : 'text-orange-400'}`}>
                    {complianceScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${complianceScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-2 rounded-full ${complianceScore >= 90 ? 'bg-green-500' : 'bg-orange-500'}`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Target: 90%</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* EU AI Act Badge */}
          {sidebarOpen && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <ShieldCheckIcon className="h-5 w-5" />
                <span>EU AI Act 2025</span>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <Image
                src="/cert-logo.png"
                alt="CERT Framework"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">CERT</span>
          </Link>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 z-50 w-72 h-full bg-gray-900 lg:hidden"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
                <span className="text-xl font-bold text-white">CERT</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2.5 rounded-lg ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          {/* Top Bar */}
          <header className="hidden lg:flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 items-center justify-between px-6">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search systems, traces, reports..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden xl:flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">4 Systems Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-gray-600 dark:text-gray-300">3 Alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CurrencyEuroIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">€2,847/mo</span>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <BellIcon className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>

              {/* User Menu */}
              <button className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">JD</span>
                </div>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6 pt-20 lg:pt-6 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
