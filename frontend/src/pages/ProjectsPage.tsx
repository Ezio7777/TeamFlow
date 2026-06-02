import { useState } from 'react';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { CardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import type { Project } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useProjects({ search: debouncedSearch });
  const deleteProject = useDeleteProject();

  const projects = data?.projects || [];
  const isAdmin = user?.role === 'ADMIN';
  const isManagerOrAbove = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProject.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditProject(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.pagination
              ? `${(data.pagination as { total: number }).total} project${(data.pagination as { total: number }).total !== 1 ? 's' : ''} in your team`
              : 'Manage your team\'s projects'}
          </p>
        </div>
        {isManagerOrAbove && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Project
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={search ? 'No projects found' : 'No projects yet'}
          description={
            search
              ? `No projects match "${search}". Try a different search term.`
              : isManagerOrAbove
              ? 'Create your first project to get started organizing your team\'s work.'
              : 'Your team hasn\'t created any projects yet.'
          }
          action={
            isManagerOrAbove && !search
              ? { label: 'Create First Project', onClick: () => setFormOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              canEdit={isManagerOrAbove}
              canDelete={isAdmin}
              onEdit={() => handleEdit(project)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </div>
      )}

      <ProjectForm
        open={formOpen}
        onClose={handleFormClose}
        project={editProject}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all tasks in this project. This action cannot be undone.`}
        confirmLabel="Delete Project"
        onConfirm={handleDelete}
        loading={deleteProject.isPending}
      />
    </div>
  );
}
