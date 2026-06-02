import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTeamMembers } from '@/hooks/useTeam';
import type { Task } from '@/types';

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  projectId: z.string().min(1, 'Select a project'),
  assignedTo: z.string().optional().nullable().default(null),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

type FormData = z.infer<typeof schema>;

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultProjectId?: string;
  defaultStatus?: string;
}

export function TaskForm({ open, onClose, task, defaultProjectId, defaultStatus }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: projectsData } = useProjects();
  const { data: members } = useTeamMembers();

  const projects = projectsData?.projects || [];

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        projectId: typeof task.projectId === 'string' ? task.projectId : task.projectId._id,
        assignedTo: task.assignedTo?._id || null,
        priority: task.priority,
      });
    } else {
      reset({
        title: '',
        description: '',
        status: (defaultStatus as 'todo' | 'in-progress' | 'done') || 'todo',
        projectId: defaultProjectId || '',
        assignedTo: null,
        priority: 'medium',
      });
    }
  }, [task, open, defaultProjectId, defaultStatus, reset]);

  const onSubmit = async (data: FormData) => {
    if (task) {
      await updateTask.mutateAsync({ id: task._id, data: { ...data, assignedTo: data.assignedTo || null } });
    } else {
      await createTask.mutateAsync({ ...data, assignedTo: data.assignedTo || null });
    }
    onClose();
  };

  const isLoading = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input {...register('title')} placeholder="Task title..." autoFocus />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
            <Textarea {...register('description')} placeholder="Task details..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Project</label>
              <Controller
                control={control}
                name="projectId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.projectId && <p className="text-xs text-red-400">{errors.projectId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assign To</label>
              <Controller
                control={control}
                name="assignedTo"
                render={({ field }) => (
                  <Select value={field.value || 'unassigned'} onValueChange={(v) => field.onChange(v === 'unassigned' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members?.map((m) => (
                        <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
