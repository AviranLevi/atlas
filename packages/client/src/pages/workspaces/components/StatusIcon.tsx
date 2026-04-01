// React / library
import { GitMerge } from 'lucide-react';
import { Loader2, Circle, CheckCircle2, XCircle, Square } from 'lucide-react';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { StatusIconProps } from '../workspaces.types';

export function StatusIcon({ status, className }: StatusIconProps) {
  if (status === 'running') return <Loader2 className={cn('animate-spin text-blue-500', className)} />;
  if (status === 'pending') return <Circle className={cn('text-yellow-500', className)} />;
  if (status === 'completed') return <CheckCircle2 className={cn('text-green-500', className)} />;
  if (status === 'merged') return <GitMerge className={cn('text-violet-500', className)} />;
  if (status === 'failed') return <XCircle className={cn('text-red-500', className)} />;
  return <Square className={cn('text-gray-400', className)} />;
}
