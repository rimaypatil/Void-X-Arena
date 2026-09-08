'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glow' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  asAnchor?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  className = '',
  asAnchor = false,
  href,
  target,
  rel,
  loading = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-display font-bold tracking-wider uppercase transition-all duration-200 select-none overflow-hidden rounded-md group text-center shrink-0 active:scale-[0.98]';

  const sizeStyles = {
    sm: 'min-h-[32px] sm:min-h-[36px] px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs gap-1.5',
    md: 'min-h-[38px] sm:min-h-[44px] px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm gap-1.5 sm:gap-2',
    lg: 'min-h-[42px] sm:min-h-[48px] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-base gap-2',
    xl: 'min-h-[46px] sm:min-h-[52px] px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-lg gap-2 sm:gap-3',
  };

  const variantStyles = {
    primary: 'bg-purple-brand hover:bg-purple-hover active:bg-purple-deep text-white shadow-purple-sm hover:shadow-purple-md border border-purple-bright/40 font-extrabold',
    secondary: 'bg-void-800 hover:bg-void-700 text-void-100 border border-void-600 hover:border-purple-brand',
    outline: 'bg-transparent hover:bg-purple-brand/10 text-purple-highlight border border-purple-brand/70 hover:border-purple-brand',
    ghost: 'bg-transparent hover:bg-void-800 text-void-300 hover:text-void-100',
    glow: 'bg-void-800 hover:bg-void-700 text-purple-highlight border border-purple-brand/50 shadow-purple-sm hover:shadow-purple-md',
    danger: 'bg-status-danger hover:bg-red-600 active:bg-red-700 text-white font-extrabold border border-red-400/40 shadow-sm',
  };

  const content = (
    <>
      {/* Subtle shine effect on hover for primary */}
      {variant === 'primary' && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
      )}
      {icon && iconPosition === 'left' && (
        <span className="transition-transform duration-200 group-hover:-translate-x-0.5 shrink-0">
          {icon}
        </span>
      )}
      <span className="relative z-10 truncate">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="transition-transform duration-200 group-hover:translate-x-0.5 shrink-0">
          {icon}
        </span>
      )}
    </>
  );

  if (asAnchor && href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        onClick={onClick as any}
      >
        {content}
      </a>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {content}
    </motion.button>
  );
};
