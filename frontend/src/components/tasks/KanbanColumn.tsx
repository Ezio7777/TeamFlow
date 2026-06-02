import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

const columnConfig = {
  todo: { label: 'Todo', color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  'in-progress': { label: 'In Progress', color: 'text-amber-400', dot: 'bg-amber-400' },
  done: { label: 'Done', color: 'text-emerald-400', dot: 'bg-emerald-500' },
};

interface KanbanColumnProps {
  status: 'todo' | 'in-progress' | 'done';
  tasks: Task[];
  onAdd: (status: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  canModify: boolean;
  canAdd: boolean;
}

export function KanbanColumn({ status, tasks, onAdd, onEdit, onDelete, canModify, canAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = columnConfig[status];

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', config.dot)} />
          <span className={cn('text-sm font-semibold', config.color)}>{config.label}</span>
          <span className="h-5 min-w-5 rounded-full bg-muted text-xs flex items-center justify-center px-1.5 text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        {canAdd && (
          <button
            onClick={() => onAdd(status)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2.5 space-y-2 min-h-[400px] transition-colors duration-200',
          isOver ? 'bg-primary/5 border border-primary/20' : 'bg-muted/20 border border-transparent'
        )}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              canModify={canModify}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground/50 py-8">No tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}
