import { useState, useEffect } from 'react';
import { Plus, Search, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useTeamMembers } from '@/hooks/useTeam';
import { TaskForm } from '@/components/tasks/TaskForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { ConfirmDialog as _Confirm } from '@/components/common/ConfirmDialog';
import { useSocket } from '@/contexts/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const statusConfig = {
  'todo': { label: 'Todo', variant: 'secondary' as const },
  'in-progress': { label: 'In Progress', variant: 'warning' as const },
  'done': { label: 'Done', variant: 'success' as const },
};

export default function TasksPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const isManagerOrAbove = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const { data: tasksData, isLoading } = useTasks({
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter,
    assignedTo: assigneeFilter === 'all' ? undefined : assigneeFilter === 'mine' ? user?._id : assigneeFilter,
  });
  const { data: members } = useTeamMembers();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const tasks = tasksData?.tasks || [];

  useEffect(() => {
    if (!socket) return;
    const refresh = () => qc.invalidateQueries({ queryKey: ['tasks'] });
    socket.on('task:updated', refresh);
    socket.on('task:created', refresh);
    socket.on('task:deleted', refresh);
    return () => {
      socket.off('task:updated', refresh);
      socket.off('task:created', refresh);
      socket.off('task:deleted', refresh);
    };
  }, [socket, qc]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteTask.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasksData ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''}` : 'All your team\'s tasks'}
          </p>
        </div>
        {isManagerOrAbove && (
          <Button size="sm" onClick={() => { setEditTask(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> New Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 h-8 text-sm w-48"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-sm w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="h-8 text-sm w-40"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="mine">Assigned to Me</SelectItem>
            {members?.map((m) => (
              <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No tasks have been created yet.'}
          action={isManagerOrAbove && !search ? { label: 'Create First Task', onClick: () => setFormOpen(true) } : undefined}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Task</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Project</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => {
                const projectName = typeof task.projectId === 'object' ? task.projectId.name : '';
                const sc = statusConfig[task.status];
                return (
                  <tr key={task._id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-muted-foreground')}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">{projectName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {/* SAFEGUARD: Check if it is a populated object first */}
                      {task.assignedTo && typeof task.assignedTo === 'object' ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={task.assignedTo.name} src={task.assignedTo.avatar} size="sm" />
                          <span className="text-xs">{task.assignedTo.name}</span>
                        </div>
                      ) : task.assignedTo ? (
                        // Temporary state while optimistic update fetches the real user object
                        <div className="flex items-center gap-2 animate-pulse">
                          <div className="h-7 w-7 rounded-full bg-muted" />
                          <div className="h-3 w-16 bg-muted rounded" />
                        </div>
                      ) : (
                        // Unassigned state
                        <span className="text-xs text-muted-foreground/60">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setEditTask(task); setFormOpen(true); }}
                        >
                          Edit
                        </Button>
                        {isManagerOrAbove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => setDeleteTarget(task)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTask(null); }}
        task={editTask}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Task"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        onConfirm={handleDeleteConfirm}
        loading={deleteTask.isPending}
      />
    </div>
  );
}
