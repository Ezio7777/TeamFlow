import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Skeleton } from '@/components/common/Skeleton';
import { useSocket } from '@/contexts/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/useToast';

const STATUSES = ['todo', 'in-progress', 'done'] as const;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ projectId: id, search: debouncedSearch });
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const isManagerOrAbove = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canModify = isManagerOrAbove || (user?.role === 'MEMBER');

  const allTasks = tasksData?.tasks || [];
  const filtered = priorityFilter === 'all' ? allTasks : allTasks.filter((t) => t.priority === priorityFilter);

  const byStatus = (status: string) => filtered.filter((t) => t.status === status);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;
    const handleTaskUpdate = () => qc.invalidateQueries({ queryKey: ['tasks'] });
    socket.on('task:updated', handleTaskUpdate);
    socket.on('task:created', handleTaskUpdate);
    socket.on('task:deleted', handleTaskUpdate);
    return () => {
      socket.off('task:updated', handleTaskUpdate);
      socket.off('task:created', handleTaskUpdate);
      socket.off('task:deleted', handleTaskUpdate);
    };
  }, [socket, qc]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as string;

      if (!STATUSES.includes(newStatus as (typeof STATUSES)[number])) return;

      const task = allTasks.find((t) => t._id === taskId);
      if (!task || task.status === newStatus) return;

      updateTask.mutate({ id: taskId, data: { status: newStatus } });
      socket?.emit('task:drag_update', { taskId, status: newStatus });
    },
    [allTasks, updateTask, socket]
  );

  const handleAddTask = (status: string) => {
    if (!isManagerOrAbove) {
      toast({
        title: 'Access Denied',
        description: 'Only Admins and Managers can create new tasks.',
        variant: 'destructive',
      });
      return;
    }
    setDefaultStatus(status);
    setEditTask(null);
    setTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setTaskFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteTask.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  };

  if (projectLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-3 gap-6 mt-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="ghost" className="mt-3" onClick={() => navigate('/projects')}>
          Go back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{project.name}</h1>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
          )}
        </div>
        
        {/* Button is now visible to everyone! */}
        <Button size="sm" onClick={() => handleAddTask('todo')}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border flex flex-wrap gap-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 h-8 text-sm w-48"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 text-sm w-36">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="p-6 min-w-max">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5">
              {STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={byStatus(status)}
                  onAdd={handleAddTask}
                  onEdit={handleEditTask}
                  onDelete={(task) => setDeleteTarget(task)}
                  canModify={canModify}
                  canAdd={isManagerOrAbove}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask && (
                <div className="opacity-90 rotate-1 shadow-2xl">
                  <TaskCard
                    task={activeTask}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    canModify={false}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <TaskForm
        open={taskFormOpen}
        onClose={() => { setTaskFormOpen(false); setEditTask(null); }}
        task={editTask}
        defaultProjectId={id}
        defaultStatus={defaultStatus}
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
