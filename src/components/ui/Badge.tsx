'use client';

import React from 'react';
import {
  type BadgeVariant,
  BADGE_CONFIGS,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
} from './badgeTokens';

export { getStatusBadgeVariant, getPriorityBadgeVariant };
export type { BadgeVariant };

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  children?: React.ReactNode;
}

const sizeClasses = {
  xs: 'text-[10px] py-0 px-2 gap-1.5',
  sm: 'text-[11px] py-0.5 px-2.5 gap-1.5',
  md: 'text-xs py-1 px-3 gap-2',
};

const dotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

export function Badge({
  variant = 'default',
  label,
  size = 'sm',
  pulse = false,
  className = '',
  children,
  style,
  ...props
}: BadgeProps) {
  const config = BADGE_CONFIGS[variant] || BADGE_CONFIGS.default;
  const content = children || label || config.label;

  return (
    <span
      className={[
        'inline-flex items-center justify-center font-mono font-semibold uppercase tracking-wider rounded-full border transition-colors select-none',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        borderColor: config.borderColor,
        backgroundColor: config.bgColor,
        color: config.textColor,
        ...style,
      }}
      {...props}
    >
      <span
        className={[
          'rounded-full shrink-0 shadow-sm',
          dotSizes[size],
          pulse ? 'animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          backgroundColor: config.dotColor,
          boxShadow: `0 0 4px ${config.dotColor}`,
        }}
        aria-hidden="true"
      />
      <span>{content}</span>
    </span>
  );
}
