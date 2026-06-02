import { useState } from 'react';
import { Copy, UserMinus, Crown, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam, useUpdateMemberRole } from '@/hooks/useTeam';
import { teamApi } from '@/api';
import { Avatar } from '@/components/common/Avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import { toast } from '@/hooks/useToast';
import { useSocket } from '@/contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import type { User, UserRole } from '@/types';

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { data: teamData, isLoading } = useTeam();
  const updateRole = useUpdateMemberRole();
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [removingId, setRemovingId] = useState('');

  const team = teamData?.team;
  const members = teamData?.members || [];
  const isAdmin = currentUser?.role === 'ADMIN';
  const onlineIds = new Set(onlineUsers.map((u) => u.userId));

  const handleCopyTeamId = () => {
    if (!team) return;
    navigator.clipboard.writeText(team._id);
    toast({ title: 'Team ID copied', description: 'Share this with teammates to join.' });
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await updateRole.mutateAsync({ userId, role });
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemovingId(removeTarget._id);
    try {
      await teamApi.removeMember(removeTarget._id);
      toast({ title: 'Member removed' });
      setRemoveTarget(null);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRemovingId('');
    }
  };

  const roleIcons: Record<UserRole, React.ElementType> = {
    ADMIN: Crown,
    MANAGER: Shield,
    MEMBER: UserIcon,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Team info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{team?.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{team?.description || 'No description'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyTeamId} className="gap-1.5 shrink-0">
          <Copy className="h-3.5 w-3.5" />
          Copy Team ID
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Members', value: members.length },
          { label: 'Online', value: members.filter((m) => onlineIds.has(m._id)).length },
          { label: 'Admins', value: members.filter((m) => m.role === 'ADMIN').length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members list */}
      <div>
        <h2 className="font-semibold mb-3">Team Members ({members.length})</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {members.map((member, idx) => {
            const RoleIcon = roleIcons[member.role];
            const isOnline = onlineIds.has(member._id);
            const isCurrentUser = member._id === currentUser?._id;

            return (
              <div
                key={member._id}
                className={`flex items-center gap-4 px-4 py-3.5 ${idx < members.length - 1 ? 'border-b border-border' : ''} hover:bg-accent/30 transition-colors`}
              >
                <Avatar
                  name={member.name}
                  src={member.avatar}
                  size="md"
                  online={isOnline}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {member.name}
                      {isCurrentUser && <span className="text-muted-foreground font-normal"> (you)</span>}
                    </span>
                    <RoleBadge role={member.role} />
                    {isOnline ? (
                      <Badge variant="success" className="text-xs py-0">Online</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {member.lastSeen
                          ? `Last seen ${formatDistanceToNow(new Date(member.lastSeen), { addSuffix: true })}`
                          : 'Offline'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                </div>

                {isAdmin && !isCurrentUser && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={member.role}
                      onValueChange={(role) => handleRoleChange(member._id, role)}
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => setRemoveTarget(member)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Team ID info card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Team ID</p>
              <p className="text-xs text-muted-foreground mt-0.5">Share this ID with teammates so they can join.</p>
              <code className="text-xs text-primary font-mono mt-1.5 block">{team?._id}</code>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyTeamId} className="shrink-0 gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove Member"
        description={`Remove ${removeTarget?.name} from the team? They will lose access to all projects and tasks.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        loading={!!removingId}
      />
    </div>
  );
}
