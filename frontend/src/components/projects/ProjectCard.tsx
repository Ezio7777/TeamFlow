import { MoreHorizontal, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import type { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, canEdit, canDelete, onEdit, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const stats = project.taskStats || { todo: 0, 'in-progress': 0, done: 0, total: 0 };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <Card className="group hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {project.description || 'No description'}
            </p>
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[140px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
                  align="end"
                >
                  {canEdit && (
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent outline-none"
                      onSelect={onEdit}
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </DropdownMenu.Item>
                  )}
                  {canDelete && (
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-destructive/20 text-red-400 outline-none"
                      onSelect={onDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stats.done} of {stats.total} tasks done</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progress === 100 ? 'bg-emerald-500' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <div className="flex gap-1.5">
            <span className="px-1.5 py-0.5 bg-muted/60 rounded text-xs">{stats.todo} todo</span>
            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs">{stats['in-progress']} active</span>
            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">{stats.done} done</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Avatar name={project.createdBy?.name || 'U'} src={project.createdBy?.avatar} size="sm" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => navigate(`/projects/${project._id}`)}
          >
            View <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
