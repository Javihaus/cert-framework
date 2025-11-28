'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LuLayoutDashboard,
  LuActivity,
  LuChartBar,
  LuSettings,
  LuBell,
  LuMoon,
  LuSun,
  LuMenu,
  LuX,
  LuLogOut,
  LuUser,
  LuBadgeHelp,
  LuDollarSign,
  LuRepeat2,
  LuHouse,
  LuKey,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@mui/joy/Button';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';
import CircularProgress from '@mui/material/CircularProgress';

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
      { name: 'Home', href: '/', icon: LuHouse },
    ],
  },
  {
    label: 'Quality Evals',
    items: [
      { name: 'Overview', href: '/quality', icon: LuLayoutDashboard },
      { name: 'LLM Judge', href: '/quality/judge', icon: LuRepeat2 },
      { name: 'Human Review', href: '/quality/review', icon: LuUser },
    ],
  },
  {
    label: 'Operational Evals',
    items: [
      { name: 'Performance', href: '/operational/performance', icon: LuActivity },
      { name: 'Cost Analysis', href: '/operational/costs', icon: LuDollarSign },
      { name: 'Observability', href: '/operational/observability', icon: LuChartBar },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Configuration', href: '/configuration', icon: LuSettings },
      { name: 'Help', href: '/help', icon: LuBadgeHelp },
    ],
  },
];

// MUI Joy theme with custom colors
const joyTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          500: '#10069f',
          600: '#0d0580',
          solidBg: '#10069f',
          solidHoverBg: '#0d0580',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          500: '#9fc2e9',
          600: '#8ab4de',
          solidBg: '#9fc2e9',
          solidHoverBg: '#8ab4de',
          solidColor: '#0A2540',
        },
      },
    },
  },
});

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/login');
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return '?';
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0A0E14]">
        <CircularProgress sx={{ color: '#10069f' }} />
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC] dark:bg-[#0A0E14]">
        <CircularProgress sx={{ color: '#10069f' }} />
      </div>
    );
  }

  return (
    <CssVarsProvider theme={joyTheme} defaultMode={darkMode ? 'dark' : 'light'}>
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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/cert-logo.png"
                alt="CERT"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden ml-auto p-1.5 text-[#596780] hover:text-[#0A2540] dark:hover:text-white"
            >
              <LuX className="w-5 h-5" />
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

          {/* Sidebar Footer - User Info */}
          <div className="px-3 py-3 border-t border-[#E3E8EE] dark:border-[#1D2530]">
            <Link href="/account" className="flex items-center gap-3 hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] rounded-lg p-1 -m-1 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#10069F] flex items-center justify-center">
                <span className="text-white text-xs font-medium">{getUserInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0A2540] dark:text-[#E8ECF1] text-sm font-medium truncate">{user.name}</p>
                <p className="text-[#8792A2] text-xs truncate">{user.email}</p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); handleLogout(); }}
                className="p-1.5 text-[#8792A2] hover:text-[#596780] dark:hover:text-[#E8ECF1] transition-colors"
              >
                <LuLogOut className="w-4 h-4" />
              </button>
            </Link>
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
                <LuMenu className="w-5 h-5" />
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Right Actions - Stripe style */}
              <div className="flex items-center gap-1">
                {/* Icon buttons */}
                <button className="relative p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors">
                  <LuBell className="w-[18px] h-[18px]" />
                </button>

                <Link
                  href="/help"
                  className="hidden md:flex p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors"
                >
                  <LuBadgeHelp className="w-[18px] h-[18px]" />
                </Link>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors"
                >
                  {darkMode ? <LuSun className="w-[18px] h-[18px]" /> : <LuMoon className="w-[18px] h-[18px]" />}
                </button>

                <Link
                  href="/configuration"
                  className="p-2 text-[#596780] hover:text-[#0A2540] dark:text-[#8792A2] dark:hover:text-white hover:bg-[#EDF1F7] dark:hover:bg-[#252D3A] rounded-md transition-colors"
                >
                  <LuSettings className="w-[18px] h-[18px]" />
                </Link>

                {/* User Menu */}
                <div className="relative ml-1">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-[#10069F] flex items-center justify-center hover:ring-2 hover:ring-[#10069F]/20 transition-all"
                  >
                    <span className="text-white text-xs font-medium">{getUserInitials()}</span>
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
                          <p className="text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1]">{user.name}</p>
                          <p className="text-xs text-[#8792A2]">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/account"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#596780] dark:text-[#8792A2] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] hover:text-[#0A2540] dark:hover:text-[#E8ECF1]"
                          >
                            <LuUser className="w-4 h-4" />
                            Account
                          </Link>
                          <Link
                            href="/account"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#596780] dark:text-[#8792A2] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] hover:text-[#0A2540] dark:hover:text-[#E8ECF1]"
                          >
                            <LuKey className="w-4 h-4" />
                            API Key
                          </Link>
                          <Link
                            href="/configuration"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#596780] dark:text-[#8792A2] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] hover:text-[#0A2540] dark:hover:text-[#E8ECF1]"
                          >
                            <LuSettings className="w-4 h-4" />
                            Settings
                          </Link>
                        </div>
                        <div className="border-t border-[#E3E8EE] dark:border-[#1D2530] pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#DF1B41] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] w-full text-left"
                          >
                            <LuLogOut className="w-4 h-4" />
                            Sign out
                          </button>
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
    </CssVarsProvider>
  );
}
