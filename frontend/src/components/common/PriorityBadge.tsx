import { Badge } from '@/components/common/Badge';
import type { TaskPriority } from '@/types';

const priorityConfig: Record<TaskPriority, { label: string; variant: 'destructive' | 'warning' | 'info' }> = {
  high: { label: 'High', variant: 'destructive' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'info' },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
