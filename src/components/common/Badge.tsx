import React from 'react';
import { cn } from '../../lib/utils';
import { PaymentStatus, SyncStatus } from '../../types/domain.types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-muted text-muted-foreground border-transparent',
    success: 'bg-success-light text-success border-success/20',
    warning: 'bg-warning-light text-warning border-warning/30',
    destructive: 'bg-destructive-light text-destructive border-destructive/20',
    outline: 'border-border text-foreground bg-transparent',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const PaymentBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  switch (status) {
    case 'paid':
      return <Badge variant="success">Fully Paid</Badge>;
    case 'partial':
      return <Badge variant="warning">Partial Debt</Badge>;
    case 'credit':
      return <Badge variant="destructive">Full Credit</Badge>;
  }
};

export const SyncBadge: React.FC<{ status: SyncStatus }> = ({ status }) => {
  switch (status) {
    case 'synced':
      return (
        <Badge variant="success" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
          Synced
        </Badge>
      );
    case 'saved_locally':
      return (
        <Badge variant="warning" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
          Saved Locally
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="info" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Syncing
        </Badge>
      );
    case 'needs_review':
      return (
        <Badge variant="destructive" size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
          Needs Review
        </Badge>
      );
  }
};

