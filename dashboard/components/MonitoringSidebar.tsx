'use client';

import { LuUpload, LuLayoutDashboard, LuTriangleAlert, LuChartBar, LuFileText, LuLock } from 'react-icons/lu';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
}

interface MonitoringSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasData: boolean;
}

export default function MonitoringSidebar({
  activeTab,
  onTabChange,
  hasData
}: MonitoringSidebarProps) {

  const items: SidebarItem[] = [
    { id: 'load', label: 'Load Data', icon: LuUpload, enabled: true },
    { id: 'overview', label: 'Overview', icon: LuLayoutDashboard, enabled: hasData },
    { id: 'failed', label: 'Failed Traces', icon: LuTriangleAlert, enabled: hasData },
    { id: 'distribution', label: 'Distribution', icon: LuChartBar, enabled: hasData },
    { id: 'documents', label: 'Documents', icon: LuFileText, enabled: hasData },
  ];

  return (
    <div className="w-60 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 fixed left-0 top-20 bottom-0 pt-8 overflow-y-auto hidden md:flex flex-col">
      {/* Section Title */}
      <span className="px-6 mb-4 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
        Monitoring
      </span>

      {/* Navigation Items */}
      <div className="flex flex-col gap-1 px-2">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => item.enabled && onTabChange(item.id)}
              disabled={!item.enabled}
              className={cn(
                'w-full px-4 py-2 rounded-md flex items-center gap-2 transition-all text-sm text-left',
                isActive
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800',
                !item.enabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Privacy Notice */}
      <div className="mt-auto px-6 py-8 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-start gap-1">
          <LuLock size={14} className="text-zinc-400 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-zinc-400 leading-relaxed">
            Your data stays private. All processing happens locally in your browser.
          </span>
        </div>
      </div>
    </div>
  );
}
