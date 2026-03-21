interface SpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md';
  /** Accessible label for screen readers */
  label?: string;
  /** Use white color (for dark buttons) */
  inverted?: boolean;
}

export default function Spinner({ size = 'md', label = 'Loading', inverted = false }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'w-6 h-6';
  const colorClass = inverted
    ? 'border-white/30 border-t-white'
    : 'border-indigo-500/30 border-t-indigo-500';

  return (
    <div
      className={`${sizeClass} border-2 ${colorClass} rounded-full motion-safe:animate-spin`}
      role="status"
      aria-label={label}
    />
  );
}
