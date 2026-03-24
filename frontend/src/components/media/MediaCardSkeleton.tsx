'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MediaCardSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MediaCardSkeleton({ size = 'md', className }: MediaCardSkeletonProps) {
  const sizeClasses = {
    sm: 'w-[120px]',
    md: 'w-[180px]',
    lg: 'w-[220px]',
  };

  return (
    <div className={cn('flex-shrink-0', sizeClasses[size], className)}>
      <Skeleton className="aspect-[2/3] w-full rounded-lg bg-card" />
    </div>
  );
}
