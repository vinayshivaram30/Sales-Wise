import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Icon to display */
  icon: ReactNode;
  /** Primary message */
  message: string;
  /** Secondary help text */
  hint?: string;
  /** Optional action (link or button) */
  action?: ReactNode;
}

export default function EmptyState({ icon, message, hint, action }: EmptyStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-dark-card flex items-center justify-center">
        {icon}
      </div>
      <p className="text-dark-label text-sm mb-1">{message}</p>
      {hint && <p className="text-dark-muted text-xs mb-3">{hint}</p>}
      {action}
    </div>
  );
}
