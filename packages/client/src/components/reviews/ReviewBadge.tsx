// Components
import { Badge } from '@/components/ui/badge';

// Types
import type { ReviewBadgeProps } from './reviews.types';

// Constants
import { STATUS_CONFIG } from './reviews.constants';

export function ReviewBadge({ status }: ReviewBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
