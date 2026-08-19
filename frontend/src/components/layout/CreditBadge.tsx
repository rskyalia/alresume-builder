'use client';

import React from 'react';
import { Zap, Coins } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CreditBadgeProps {
  plan: 'free' | 'pro';
  credits: number;
  /** Optional extra class names for the wrapper element */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CreditBadge — compact header component that shows the user's plan and
 * remaining resume credits.
 *
 * - Pro users: shows a single "Pro" badge in green/blue.
 * - Free users: shows a "Free" badge + remaining credits count.
 */
export function CreditBadge({ plan, credits, className }: CreditBadgeProps) {
  if (plan === 'pro') {
    return (
      <Badge
        className={cn(
          'flex items-center gap-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-transparent hover:from-blue-600 hover:to-emerald-600',
          className,
        )}
      >
        <Zap className="h-3 w-3" aria-hidden="true" />
        <span>Pro</span>
      </Badge>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Badge variant="secondary" className="flex items-center gap-1">
        <span>Free</span>
      </Badge>
      <Badge
        variant="outline"
        className={cn(
          'flex items-center gap-1',
          credits === 0 && 'border-destructive text-destructive',
        )}
        title={`${credits} kredit resume tersisa`}
      >
        <Coins className="h-3 w-3" aria-hidden="true" />
        <span>{credits} kredit</span>
      </Badge>
    </div>
  );
}

export default CreditBadge;
