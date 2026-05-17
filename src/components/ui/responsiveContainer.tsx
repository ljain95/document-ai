"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  center?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  none: '',
};

const paddingClasses = {
  none: '',
  sm: 'px-3 md:px-4',
  md: 'px-4 md:px-6',
  lg: 'px-6 md:px-8',
};

/**
 * Responsive container component that provides consistent max-width and padding
 * across different screen sizes. Automatically centers content when max-width is applied.
 */
export function ResponsiveContainer({
  children,
  maxWidth = '4xl',
  padding = 'md',
  className,
  center = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        maxWidth !== 'none' && maxWidthClasses[maxWidth],
        center && maxWidth !== 'none' && 'mx-auto',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Chat-specific container with optimal width for conversation UI
 * Updated to 6xl (1152px) for 30% wider chat area
 */
export function ChatContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveContainer maxWidth="6xl" padding="md" className={cn('h-full', className)}>
      {children}
    </ResponsiveContainer>
  );
}

/**
 * Content container for general page content with comfortable reading width
 */
export function ContentContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveContainer maxWidth="6xl" padding="md" className={className}>
      {children}
    </ResponsiveContainer>
  );
}

/**
 * Form container with narrower width optimized for forms and inputs
 */
export function FormContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveContainer maxWidth="2xl" padding="md" className={className}>
      {children}
    </ResponsiveContainer>
  );
}
