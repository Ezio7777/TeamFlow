import { Badge } from '@/components/common/Badge';
import type { UserRole } from '@/types';

const roleConfig: Record<UserRole, { label: string; variant: 'default' | 'warning' | 'info' }> = {
  ADMIN: { label: 'Admin', variant: 'default' },
  MANAGER: { label: 'Manager', variant: 'warning' },
  MEMBER: { label: 'Member', variant: 'info' },
};

export function RoleBadge({ role }: { role: UserRole }) {
  const config = roleConfig[role];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
