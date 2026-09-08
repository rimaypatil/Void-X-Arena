import React from 'react';
import { TournamentStatus } from '@/types/tournament';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'crimson' | 'emerald' | 'amber' | 'surface' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  size = 'sm',
  pulse = false,
  className = '',
}) => {
  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[9px] sm:text-[10px] tracking-wider uppercase font-bold',
    sm: 'px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs tracking-wider uppercase font-bold',
    md: 'px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm tracking-wider uppercase font-bold',
  };

  const variantStyles = {
    purple: 'bg-purple-brand/15 text-purple-highlight border border-purple-brand/40',
    crimson: 'bg-status-danger/15 text-status-danger border border-status-danger/40',
    emerald: 'bg-status-success/15 text-status-success border border-status-success/40',
    amber: 'bg-status-warning/15 text-status-warning border border-status-warning/40',
    surface: 'bg-void-700 text-void-300 border border-void-600',
    outline: 'bg-transparent text-void-300 border border-void-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm select-none font-display shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'emerald' ? 'bg-status-success' :
            variant === 'crimson' ? 'bg-status-danger' :
            variant === 'amber' ? 'bg-status-warning' : 'bg-purple-bright'
          }`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${
            variant === 'emerald' ? 'bg-status-success' :
            variant === 'crimson' ? 'bg-status-danger' :
            variant === 'amber' ? 'bg-status-warning' : 'bg-purple-brand'
          }`} />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TournamentStatus }> = ({ status }) => {
  switch (status) {
    case 'LIVE':
      return (
        <Badge variant="crimson" pulse size="xs">
          LIVE MATCH
        </Badge>
      );
    case 'FILLING_FAST':
      return (
        <Badge variant="amber" pulse size="xs">
          FILLING FAST
        </Badge>
      );
    case 'UPCOMING':
      return <Badge variant="purple" size="xs">REGISTERING</Badge>;
    case 'COMPLETED':
      return <Badge variant="surface" size="xs">ENDED</Badge>;
    default:
      return null;
  }
};
