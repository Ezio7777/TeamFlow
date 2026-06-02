import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Calendar } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import type { Task } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  canModify: boolean;
}

export function TaskCard({ task, onEdit, onDelete, canModify }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    disabled: !canModify,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const projectName = typeof task.projectId === 'object' ? task.projectId.name : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-card rounded-lg border border-border p-3 space-y-2.5 transition-all duration-150',
        isDragging ? 'opacity-50 shadow-xl scale-105 rotate-1' : 'hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-2">
        {canModify && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
        {canModify && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {projectName && (
          <span className="text-xs text-muted-foreground/70 truncate max-w-[100px]">{projectName}</span>
        )}
        {task.assignedTo ? (
          <Avatar name={task.assignedTo.name} src={task.assignedTo.avatar} size="sm" className="ml-auto" />
        ) : (
          <div className="ml-auto h-7 w-7 rounded-full border border-dashed border-border" />
        )}
      </div>
    </div>
  );
}
