'use client';

import { ReactNode } from 'react';
import {
  LuPlay,
  LuDownload,
  LuSettings,
  LuPlus,
  LuSearch,
  LuChartBar,
  LuArrowRight,
} from 'react-icons/lu';
import Card from './Card';
import Button from './Button';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

export function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  variant = 'default',
}: QuickActionCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-2 p-6 rounded-lg cursor-pointer transition-all text-left hover:-translate-y-0.5 hover:shadow-md',
        isPrimary
          ? 'bg-[#3C6098] hover:bg-[#3C6098]/90 border-none'
          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-[#3C6098]'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-md',
          isPrimary
            ? 'bg-white/20 text-white'
            : 'bg-[#3C6098]/10 dark:bg-[#3C6098]/20 text-[#3C6098] dark:text-[#3C6098]'
        )}
      >
        {icon}
      </div>

      <div>
        <h3
          className={cn(
            'text-base font-semibold mb-1',
            isPrimary ? 'text-white' : 'text-zinc-900 dark:text-white'
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'text-[13px]',
            isPrimary ? 'text-white/80' : 'text-zinc-400'
          )}
        >
          {description}
        </p>
      </div>
    </button>
  );
}

interface QuickActionsProps {
  onRunCheck?: () => void;
  onExportReport?: () => void;
  onConfigure?: () => void;
  onAddMonitor?: () => void;
  onViewFailed?: () => void;
  onViewDistribution?: () => void;
  onExport?: () => void;
}

export default function QuickActions({
  onRunCheck,
  onExportReport,
  onConfigure,
  onAddMonitor,
  onViewFailed,
  onViewDistribution,
  onExport,
}: QuickActionsProps) {
  const isLegacy = onViewFailed || onViewDistribution || onExport;

  if (isLegacy) {
    return (
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Quick Actions
        </h2>

        <div className="flex gap-2 flex-wrap">
          {onViewFailed && (
            <Button
              variant="primary"
              icon={<LuSearch size={18} />}
              onClick={onViewFailed}
            >
              Investigate Failed Traces
            </Button>
          )}
          {onExport && (
            <Button
              variant="secondary"
              icon={<LuDownload size={18} />}
              onClick={onExport}
            >
              Export to CSV
            </Button>
          )}
          {onViewDistribution && (
            <Button
              variant="secondary"
              icon={<LuChartBar size={18} />}
              onClick={onViewDistribution}
            >
              View Distribution
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6">
      <span className="text-sm font-medium text-zinc-400 mb-4 block">
        Quick Actions
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          icon={<LuPlay size={20} />}
          title="Run Compliance Check"
          description="Execute full compliance scan"
          onClick={onRunCheck || (() => {})}
          variant="primary"
        />

        <QuickActionCard
          icon={<LuDownload size={20} />}
          title="Export Report"
          description="Generate EU AI Act document"
          onClick={onExportReport || (() => {})}
        />

        <QuickActionCard
          icon={<LuPlus size={20} />}
          title="Add LuMonitor"
          description="Track a new endpoint"
          onClick={onAddMonitor || (() => {})}
        />

        <QuickActionCard
          icon={<LuSettings size={20} />}
          title="Configure"
          description="Manage alert rules"
          onClick={onConfigure || (() => {})}
        />
      </div>
    </Card>
  );
}

interface InlineActionsProps {
  actions: Array<{
    icon: ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
}

export function InlineActions({ actions }: InlineActionsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'secondary'}
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

interface ActionLinkProps {
  children: ReactNode;
  onClick: () => void;
}

export function ActionLink({ children, onClick }: ActionLinkProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-[#3C6098] dark:text-[#3C6098] text-sm font-medium cursor-pointer transition-colors hover:text-[#3C6098]/80 dark:hover:text-[#3C6098]/80"
    >
      {children}
      <LuArrowRight size={14} />
    </button>
  );
}
