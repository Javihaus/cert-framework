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
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'live' | 'count' | 'warning';
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Monitoring', href: '/monitoring', icon: Activity, badge: 'Live', badgeType: 'live' },
  { name: 'Compliance', href: '/compliance', icon: Shield, badge: '3', badgeType: 'warning' },
  { name: 'Assessment', href: '/assessment', icon: FileText },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
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
      <aside
        className={`sidebar ${mobileMenuOpen ? 'open' : ''} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <Image
              src="/cert-logo.png"
              alt="CERT"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm tracking-tight">CERT Framework</span>
            <span className="text-white/50 text-xs">EU AI Act Compliance</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden ml-auto p-1.5 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compliance Score */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Compliance Score
              </span>
              <span className={`text-sm font-semibold ${
                complianceScore >= 90 ? 'text-emerald-400' :
                complianceScore >= 70 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {complianceScore}%
              </span>
            </div>
            <div className="progress-bar bg-white/20">
              <div
                className={`progress-fill ${
                  complianceScore >= 90 ? 'success' :
                  complianceScore >= 70 ? 'warning' : 'error'
                }`}
                style={{ width: `${complianceScore}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-xs">+5% this month</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className={`
                    ${item.badgeType === 'live'
                      ? 'flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium'
                      : item.badgeType === 'warning'
                      ? 'flex items-center justify-center w-5 h-5 bg-coral/20 text-coral rounded-full text-xs font-medium'
                      : 'px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-medium'
                    }
                  `}>
                    {item.badgeType === 'live' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                    )}
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-planetarium flex items-center justify-center">
              <span className="text-white text-xs font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">John Doe</p>
              <p className="text-white/50 text-xs truncate">Admin</p>
            </div>
            <button className="p-1.5 text-white/50 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-midnight border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-porpoise hover:text-midnight dark:hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-porpoise" />
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
                <div className="flex items-center gap-2 text-porpoise">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>4 Systems Active</span>
                </div>
                <div className="flex items-center gap-2 text-porpoise">
                  <AlertTriangle className="w-4 h-4 text-coral" />
                  <span>3 Alerts</span>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-porpoise hover:text-midnight dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-porpoise hover:text-midnight dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Help */}
              <button className="hidden md:flex p-2 text-porpoise hover:text-midnight dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-planetarium to-bridgeport flex items-center justify-center">
                    <span className="text-white text-xs font-medium">JD</span>
                  </div>
                  <ChevronDown className="hidden md:block w-4 h-4 text-porpoise" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-white/10 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-white/10">
                        <p className="text-sm font-medium text-midnight dark:text-white">John Doe</p>
                        <p className="text-xs text-porpoise">john@company.com</p>
                      </div>
                      <div className="py-1">
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-midnight dark:text-white hover:bg-gray-50 dark:hover:bg-white/10">
                          <User className="w-4 h-4" />
                          Profile
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-midnight dark:text-white hover:bg-gray-50 dark:hover:bg-white/10">
                          <Settings className="w-4 h-4" />
                          Settings
                        </a>
                      </div>
                      <div className="border-t border-gray-100 dark:border-white/10 pt-1">
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-coral hover:bg-gray-50 dark:hover:bg-white/10">
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
