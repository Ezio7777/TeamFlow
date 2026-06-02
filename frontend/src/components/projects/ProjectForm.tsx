import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import type { Project } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().default(''),
});

type FormData = z.infer<typeof schema>;

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectForm({ open, onClose, project }: ProjectFormProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (project) {
      reset({ name: project.name, description: project.description });
    } else {
      reset({ name: '', description: '' });
    }
  }, [project, reset, open]);

  const onSubmit = async (data: FormData) => {
    if (project) {
      await updateProject.mutateAsync({ id: project._id, data });
    } else {
      await createProject.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = createProject.isPending || updateProject.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project Name</label>
            <Input {...register('name')} placeholder="e.g. Mobile App Redesign" autoFocus />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
            <Textarea {...register('description')} placeholder="Brief overview of the project..." rows={3} />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
