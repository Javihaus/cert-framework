'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  ChartBarIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CurrencyEuroIcon,
  ServerStackIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [complianceScore, setComplianceScore] = useState(85);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Navigation items with EU AI Act focus
  const navigation = [
    { 
      name: 'Overview', 
      href: '/', 
      icon: ChartBarIcon,
      description: 'Real-time compliance & monitoring dashboard',
      badge: null 
    },
    { 
      name: 'Live Monitoring', 
      href: '/monitoring', 
      icon: ServerStackIcon,
      description: 'Track AI system performance in real-time',
      badge: 'LIVE' 
    },
    { 
      name: 'Compliance Center', 
      href: '/compliance', 
      icon: ShieldCheckIcon,
      description: 'EU AI Act Article 15 compliance tracking',
      badge: complianceScore < 90 ? 'ACTION' : null 
    },
    { 
      name: 'Risk Assessment', 
      href: '/assessments', 
      icon: ClipboardDocumentCheckIcon,
      description: 'Evaluate AI system risk classification',
      badge: null 
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: DocumentTextIcon,
      description: 'Generate compliance documentation',
      badge: null 
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: ChartPieIcon,
      description: 'Cost analysis & performance insights',
      badge: null 
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Cog6ToothIcon,
      description: 'Configure integrations & preferences',
      badge: null 
    },
  ];

  // Quick stats for header
  const quickStats = [
    { label: 'Compliance Score', value: `${complianceScore}%`, trend: 'up', change: '+2.3%' },
    { label: 'Active Systems', value: '12', trend: 'stable', change: '0' },
    { label: 'Monthly Cost', value: '€2,847', trend: 'down', change: '-5.2%' },
    { label: 'Failed Traces', value: '3', trend: 'up', change: '+1' },
  ];

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        
        {/* Sidebar - Desktop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="hidden lg:flex lg:flex-shrink-0"
            >
              <div className="flex flex-col w-72">
                <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                  
                  {/* Logo Section */}
                  <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <img 
                          src="https://github.com/Javihaus/cert-framework/raw/master/docs/CERT_LOGO_NEW_1.png" 
                          alt="CERT" 
                          className="w-8 h-8"
                        />
                      </div>
                      <div>
                        <h1 className="text-white font-bold text-xl">CERT</h1>
                        <p className="text-blue-100 text-xs">EU AI Act Compliance</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 px-4 py-6 space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`
                            group flex items-center px-3 py-3 text-sm font-medium rounded-xl
                            transition-all duration-200 relative
                            ${isActive 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400' 
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }
                          `}
                        >
                          <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>{item.name}</span>
                              {item.badge && (
                                <span className={`
                                  px-2 py-0.5 text-xs font-bold rounded-full
                                  ${item.badge === 'LIVE' 
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 animate-pulse' 
                                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                  }
                                `}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Compliance Status Card */}
                  <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">EU AI Act Status</span>
                        {complianceScore >= 90 ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-300" />
                        )}
                      </div>
                      <div className="text-2xl font-bold mb-1">{complianceScore}% Compliant</div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <motion.div 
                          className="bg-white rounded-full h-2"
                          initial={{ width: 0 }}
                          animate={{ width: `${complianceScore}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-xs mt-2 text-blue-100">
                        {complianceScore >= 90 
                          ? 'System meets Article 15 requirements' 
                          : 'Action required for full compliance'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Top Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                
                {/* Left side - Search & Toggle */}
                <div className="flex items-center space-x-4 flex-1">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:block hidden"
                  >
                    <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  
                  {/* Mobile menu button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                  >
                    {mobileMenuOpen ? (
                      <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>

                  {/* Search Bar */}
                  <div className="relative max-w-md flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search systems, traces, or compliance docs..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                    />
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center space-x-3 ml-4">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {darkMode ? (
                      <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>

                  {/* Notifications */}
                  <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {notifications}
                      </span>
                    )}
                  </button>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Javier M.</span>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </button>

                    {/* User Dropdown */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                        >
                          <div className="py-1">
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                              Profile Settings
                            </a>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                              API Keys
                            </a>
                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <a href="#" className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                              Sign out
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {quickStats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        {stat.trend === 'up' && (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                        )}
                        {stat.trend === 'down' && (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 rotate-180" />
                        )}
                        {stat.trend === 'stable' && (
                          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        )}
                        <span className={`text-xs mt-1 font-medium ${
                          stat.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                          stat.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </header>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <nav className="px-4 py-4 space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-lg
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-300'
                          }
                        `}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                        {item.badge && (
                          <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}