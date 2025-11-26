'use client';

import {
  LayoutDashboard,
  Monitor,
  FileCheck,
  TrendingUp,
  Settings,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import Badge, { CountBadge } from './Badge';
import { cn } from '@/lib/utils';

// Navigation sections
type NavigationSection =
  | 'home'
  | 'monitoring'
  | 'compliance'
  | 'analytics'
  | 'settings'
  | 'documentation'; // Legacy support

interface Tab {
  id: NavigationSection;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface NavigationProps {
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  notificationCount?: number;
  userName?: string;
  userAvatar?: string;
}

export default function Navigation({
  activeSection,
  onSectionChange,
  notificationCount = 0,
  userName = 'User',
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: Tab[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
    { id: 'compliance', label: 'Compliance', icon: FileCheck, badge: 3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-zinc-900 dark:bg-zinc-950 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="h-20 flex items-center justify-between">
          {/* Logo Section */}
          <LogoSection />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <NavTab
                key={tab.id}
                tab={tab}
                isActive={activeSection === tab.id}
                onClick={() => onSectionChange(tab.id)}
              />
            ))}
          </div>

          {/* Right Section - User & Notifications */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell count={notificationCount} />

            {/* Settings */}
            <NavIconButton
              icon={Settings}
              isActive={activeSection === 'settings'}
              onClick={() => onSectionChange('settings')}
              aria-label="Settings"
            />

            {/* User Avatar */}
            <UserAvatar name={userName} />

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden">
              <NavIconButton
                icon={mobileMenuOpen ? X : Menu}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        tabs={tabs}
        activeSection={activeSection}
        onSectionChange={(section) => {
          onSectionChange(section);
          setMobileMenuOpen(false);
        }}
      />
    </nav>
  );
}

function LogoSection() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-md bg-[#3C6098] flex items-center justify-center">
        <span className="text-white font-bold text-lg">C</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-2xl font-bold text-white tracking-tight">
          CERT
        </span>
        <Badge variant="primary" size="sm">
          PRO
        </Badge>
      </div>
    </div>
  );
}

interface NavTabProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}

function NavTab({ tab, isActive, onClick }: NavTabProps) {
  const IconComponent = tab.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all relative',
        isActive
          ? 'text-white bg-zinc-700'
          : 'text-zinc-400 hover:text-white hover:bg-white/10'
      )}
    >
      <IconComponent size={18} />
      <span>{tab.label}</span>
      {tab.badge && tab.badge > 0 && (
        <CountBadge count={tab.badge} variant="warning" size="sm" />
      )}
    </button>
  );
}

interface NavIconButtonProps {
  icon: typeof Settings;
  isActive?: boolean;
  onClick: () => void;
  'aria-label': string;
}

function NavIconButton({
  icon: Icon,
  isActive = false,
  onClick,
  'aria-label': ariaLabel,
}: NavIconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-md cursor-pointer transition-all',
        isActive
          ? 'text-white bg-zinc-700'
          : 'text-zinc-400 hover:text-white hover:bg-white/10'
      )}
    >
      <Icon size={20} />
    </button>
  );
}

function NotificationBell({ count }: { count: number }) {
  return (
    <div className="relative">
      <NavIconButton
        icon={Bell}
        onClick={() => {}}
        aria-label={`Notifications${count > 0 ? ` (${count})` : ''}`}
      />
      {count > 0 && (
        <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center px-1 border-2 border-zinc-900">
          {count > 9 ? '9+' : count}
        </div>
      )}
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#3C6098] text-white text-sm font-semibold cursor-pointer transition-all hover:bg-[#3C6098]/90">
      {initials}
    </button>
  );
}

interface MobileDrawerProps {
  isOpen: boolean;
  tabs: Tab[];
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
}

function MobileDrawer({
  isOpen,
  tabs,
  activeSection,
  onSectionChange,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-20 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-4 block md:hidden shadow-lg">
      <div className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className={cn(
                'flex items-center gap-2 p-4 rounded-md text-base font-medium cursor-pointer transition-all w-full text-left',
                isActive
                  ? 'text-white bg-zinc-700'
                  : 'text-zinc-400 hover:bg-white/10'
              )}
            >
              <IconComponent size={20} />
              <span className="flex-1">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <CountBadge count={tab.badge} variant="warning" size="sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { NavigationSection };
