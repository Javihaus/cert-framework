'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Shield,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'live' | 'count' | 'warning';
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard },
      { name: 'Monitoring', href: '/monitoring', icon: Activity, badge: 'Live', badgeType: 'live' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { name: 'Compliance', href: '/compliance', icon: Shield, badge: '3', badgeType: 'warning' },
      { name: 'Assessment', href: '/assessment', icon: FileText },
      { name: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Costs', href: '/costs', icon: DollarSign },
      { name: 'Optimization', href: '/optimization', icon: Zap },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cert-dark-mode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cert-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const complianceScore = 87;

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn('sidebar', mobileMenuOpen && 'open', 'lg:translate-x-0')}>
        {/* Logo - matching 56px header height */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center overflow-hidden">
            <Image
              src="/cert-logo.png"
              alt="CERT"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-900 dark:text-white font-semibold text-sm tracking-tight">
              CERT Framework
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              EU AI Act Compliance
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden ml-auto p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compliance Score Card */}
        <div className="px-3 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                Compliance Score
              </span>
              <span className={cn(
                'text-sm font-semibold',
                complianceScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                complianceScore >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              )}>
                {complianceScore}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={cn(
                  'progress-fill',
                  complianceScore >= 90 ? 'success' :
                  complianceScore >= 70 ? 'warning' : 'error'
                )}
                style={{ width: `${complianceScore}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 text-xs">+5% this month</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {section.label && (
                <div className="nav-section-label">{section.label}</div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn('nav-item', isActive && 'active')}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={cn(
                          item.badgeType === 'live'
                            ? 'flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium'
                            : item.badgeType === 'warning'
                            ? 'flex items-center justify-center w-5 h-5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-xs font-medium'
                            : 'px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-medium'
                        )}>
                          {item.badgeType === 'live' && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                          )}
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-900 dark:text-white text-sm font-medium truncate">John Doe</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate">Admin</p>
            </div>
            <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header - 56px height */}
        <header className="sticky top-0 z-30 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search systems, traces, reports..."
                  className="input input-with-icon"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Stats - Desktop */}
              <div className="hidden xl:flex items-center gap-4 mr-4 text-sm">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>4 Systems Active</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>3 Alerts</span>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Help */}
              <button className="hidden md:flex p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">JD</span>
                  </div>
                  <ChevronDown className="hidden md:block w-4 h-4 text-zinc-500" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-elevated border border-zinc-200 dark:border-zinc-700 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-700">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">John Doe</p>
                        <p className="text-xs text-zinc-500">john@company.com</p>
                      </div>
                      <div className="py-1">
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                          <User className="w-4 h-4" />
                          Profile
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                          <Settings className="w-4 h-4" />
                          Settings
                        </a>
                      </div>
                      <div className="border-t border-zinc-100 dark:border-zinc-700 pt-1">
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
