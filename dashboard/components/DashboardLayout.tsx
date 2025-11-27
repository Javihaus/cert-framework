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
  DollarSign,
  Zap,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'live' | 'count' | 'warning' | 'new';
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [
      { name: 'Home', href: '/', icon: Home },
    ],
  },
  {
    label: 'Quality Evals',
    items: [
      { name: 'Overview', href: '/quality', icon: LayoutDashboard },
      { name: 'LLM Judge', href: '/quality/judge', icon: Zap },
      { name: 'Human Review', href: '/quality/review', icon: User },
    ],
  },
  {
    label: 'Operational Evals',
    items: [
      { name: 'Performance', href: '/operational/performance', icon: Activity },
      { name: 'Cost Analysis', href: '/operational/costs', icon: DollarSign },
      { name: 'Observability', href: '/operational/observability', icon: BarChart3 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Configuration', href: '/configuration', icon: Settings },
      { name: 'Help', href: '/help', icon: HelpCircle },
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

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Stripe style */}
      <aside className={cn('sidebar', mobileMenuOpen && 'open', 'lg:translate-x-0')}>
        {/* Logo - Stripe style header */}
        <div className="flex items-center gap-3 px-4 h-[52px] border-b border-[#E3E8EE] dark:border-[#1D2530]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <Image
              src="/cert-logo.png"
              alt="CERT"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#0A2540] dark:text-[#E8ECF1] font-semibold text-[15px]">
              CERT
            </span>
            <ChevronDown className="w-4 h-4 text-[#8792A2]" />
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden ml-auto p-1.5 text-[#596780] hover:text-[#0A2540] dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Stripe style */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-5' : ''}>
              {section.label && (
                <div className="nav-section-label">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'nav-item',
                        isActive && 'active'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={cn(
                          item.badgeType === 'live'
                            ? 'flex items-center gap-1.5 px-2 py-0.5 bg-[#D4EDDA] dark:bg-[rgba(48,177,48,0.2)] text-[#228B22] dark:text-[#4ADE4A] rounded text-[11px] font-medium'
                            : item.badgeType === 'warning'
                            ? 'flex items-center justify-center w-5 h-5 bg-[#FDECEA] dark:bg-[rgba(223,27,65,0.2)] text-[#C41230] dark:text-[#FF6B8A] rounded-full text-[11px] font-medium'
                            : item.badgeType === 'new'
                            ? 'badge-new'
                            : 'px-2 py-0.5 bg-[#F0F3F7] dark:bg-[#1D2530] text-[#596780] dark:text-[#8792A2] rounded text-[11px] font-medium'
                        )}>
                          {item.badgeType === 'live' && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30B130] opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#30B130]" />
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

        {/* Sidebar Footer - Stripe style */}
        <div className="px-3 py-3 border-t border-[#E3E8EE] dark:border-[#1D2530]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#635BFF] flex items-center justify-center">
              <span className="text-white text-xs font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#0A2540] dark:text-[#E8ECF1] text-sm font-medium truncate">John Doe</p>
              <p className="text-[#8792A2] text-xs truncate">Admin</p>
            </div>
            <button className="p-1.5 text-[#8792A2] hover:text-[#596780] dark:hover:text-[#E8ECF1] transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header - Stripe style */}
        <header className="sticky top-0 z-30 h-[52px] bg-white dark:bg-[#151B24] border-b border-[#E3E8EE] dark:border-[#1D2530]">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#596780] hover:text-[#0A2540] dark:hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search - Stripe style centered */}
            <div className="hidden md:flex flex-1 justify-center max-w-[400px] mx-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8792A2]" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="input search-input input-with-icon w-full h-9 rounded-lg"
                />
              </div>
            </div>

            {/* Right Actions - Stripe style */}
            <div className="flex items-center gap-1">
              {/* Mode toggle */}
              <span className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-[13px] text-[#596780] dark:text-[#8792A2]">
                Test mode
                <button
                  onClick={() => {}}
                  className="relative w-9 h-5 bg-[#E3E8EE] dark:bg-[#1D2530] rounded-full transition-colors"
                >
                  <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" />
                </button>
              </span>

              {/* Icon buttons */}
              <button className="relative p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors">
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DF1B41] rounded-full" />
              </button>

              <Link
                href="/help"
                className="hidden md:flex p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors"
              >
                <HelpCircle className="w-[18px] h-[18px]" />
              </Link>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors"
              >
                {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              <button className="p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors">
                <Settings className="w-[18px] h-[18px]" />
              </button>

              {/* User Menu - Stripe style avatar */}
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 rounded-full bg-[#635BFF] flex items-center justify-center hover:ring-2 hover:ring-[#635BFF]/20 transition-all"
                >
                  <span className="text-white text-xs font-medium">JD</span>
                </button>

                {/* User Dropdown - Stripe style */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#151B24] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-[#E3E8EE] dark:border-[#1D2530] py-1 z-50 animate-scale-in">
                      <div className="px-4 py-3 border-b border-[#E3E8EE] dark:border-[#1D2530]">
                        <p className="text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1]">John Doe</p>
                        <p className="text-xs text-[#8792A2]">john@company.com</p>
                      </div>
                      <div className="py-1">
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-[#596780] dark:text-[#8792A2] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] hover:text-[#0A2540] dark:hover:text-[#E8ECF1]">
                          <User className="w-4 h-4" />
                          Profile
                        </a>
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-[#596780] dark:text-[#8792A2] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] hover:text-[#0A2540] dark:hover:text-[#E8ECF1]">
                          <Settings className="w-4 h-4" />
                          Settings
                        </a>
                      </div>
                      <div className="border-t border-[#E3E8EE] dark:border-[#1D2530] pt-1">
                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-[#DF1B41] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530]">
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
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
