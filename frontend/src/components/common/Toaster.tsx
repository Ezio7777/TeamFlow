import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-fade-in',
            toast.variant === 'destructive'
              ? 'bg-destructive/20 border-red-800/50 text-red-300'
              : 'bg-card border-border text-foreground'
          )}
        >
          {toast.variant === 'destructive' ? (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
