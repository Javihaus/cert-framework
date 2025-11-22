import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBannerProps {
  isCompliant: boolean;
  accuracy: number;
  failedCount: number;
}

export default function StatusBanner({ isCompliant, accuracy, failedCount }: StatusBannerProps) {
  const variant = isCompliant
    ? {
        borderClass: 'border-green-600',
        icon: CheckCircle2,
        iconClass: 'text-green-600',
        title: 'Meets Compliance Threshold',
        message: `Accuracy at ${(accuracy * 100).toFixed(1)}% (target: 90%). System ready for deployment.`,
      }
    : {
        borderClass: 'border-amber-500',
        icon: AlertTriangle,
        iconClass: 'text-amber-500',
        title: 'Below Compliance Threshold',
        message: `Accuracy at ${(accuracy * 100).toFixed(1)}% (target: 90%). Review ${failedCount} failed traces to identify systematic issues.`,
      };

  const Icon = variant.icon;

  return (
    <div
      className={cn(
        'bg-white dark:bg-zinc-900 border-2 rounded-lg p-6 mb-12',
        variant.borderClass
      )}
    >
      <div className="flex gap-4 items-start">
        <Icon
          size={24}
          className={variant.iconClass}
          strokeWidth={2}
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
            {variant.title}
          </h3>
          <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {variant.message}
          </p>
        </div>
      </div>
    </div>
  );
}
