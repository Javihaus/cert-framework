'use client';

import { ReactNode } from 'react';
import {
  Play,
  Download,
  Settings,
  Plus,
  Search,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
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
          ? 'bg-blue-700 hover:bg-blue-600 border-none'
          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-md',
          isPrimary
            ? 'bg-white/20 text-white'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
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
              icon={<Search size={18} />}
              onClick={onViewFailed}
            >
              Investigate Failed Traces
            </Button>
          )}
          {onExport && (
            <Button
              variant="secondary"
              icon={<Download size={18} />}
              onClick={onExport}
            >
              Export to CSV
            </Button>
          )}
          {onViewDistribution && (
            <Button
              variant="secondary"
              icon={<BarChart3 size={18} />}
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
          icon={<Play size={20} />}
          title="Run Compliance Check"
          description="Execute full compliance scan"
          onClick={onRunCheck || (() => {})}
          variant="primary"
        />

        <QuickActionCard
          icon={<Download size={20} />}
          title="Export Report"
          description="Generate EU AI Act document"
          onClick={onExportReport || (() => {})}
        />

        <QuickActionCard
          icon={<Plus size={20} />}
          title="Add Monitor"
          description="Track a new endpoint"
          onClick={onAddMonitor || (() => {})}
        />

        <QuickActionCard
          icon={<Settings size={20} />}
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
      className="flex items-center gap-1 text-blue-600 dark:text-blue-500 text-sm font-medium cursor-pointer transition-colors hover:text-blue-700 dark:hover:text-blue-400"
    >
      {children}
      <ArrowRight size={14} />
    </button>
  );
}
