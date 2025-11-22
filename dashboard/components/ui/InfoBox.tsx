import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface InfoBoxProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
}

export function InfoBox({ type, title, children }: InfoBoxProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-600',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-600',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-500',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      icon: XCircle,
      iconColor: 'text-red-500',
    },
  };

  const style = styles[type];
  const IconComponent = style.icon;

  return (
    <div
      className={cn(
        'border rounded-md p-4',
        style.bg,
        style.border
      )}
    >
      <div className="flex gap-2">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent size={20} className={style.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1">
          {title && (
            <p className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}
