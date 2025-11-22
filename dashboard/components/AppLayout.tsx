'use client';

import { cn } from '@/lib/utils';
import Navigation, { NavigationSection } from './Navigation';
import MonitoringSidebar from './MonitoringSidebar';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  activeSection: NavigationSection;
  activeMonitoringTab?: string;
  onSectionChange: (section: NavigationSection) => void;
  onMonitoringTabChange?: (tab: string) => void;
  hasData: boolean;
}

export default function AppLayout({
  children,
  activeSection,
  activeMonitoringTab = 'load',
  onSectionChange,
  onMonitoringTabChange = () => {},
  hasData
}: AppLayoutProps) {

  const showSidebar = activeSection === 'monitoring';

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">

      {/* Top Navigation - ALWAYS VISIBLE */}
      <Navigation
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 relative justify-center">

        {/* Conditional Sidebar - ONLY in Monitoring section */}
        {showSidebar && (
          <MonitoringSidebar
            activeTab={activeMonitoringTab}
            onTabChange={onMonitoringTabChange}
            hasData={hasData}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            'w-full max-w-6xl px-8 py-12 transition-[margin-left] duration-300',
            showSidebar ? 'md:ml-60' : 'ml-0'
          )}
        >
          {children}
        </main>

      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
