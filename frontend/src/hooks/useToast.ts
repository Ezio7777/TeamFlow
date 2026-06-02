import { useState, useEffect, useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

const notify = (newToasts: Toast[]) => {
  toasts = newToasts;
  listeners.forEach((l) => l(toasts));
};

export const toast = (options: ToastOptions) => {
  const id = Math.random().toString(36).slice(2);
  const newToast: Toast = { id, duration: 4000, ...options };
  notify([...toasts, newToast]);

  setTimeout(() => {
    notify(toasts.filter((t) => t.id !== id));
  }, newToast.duration);
};

export const useToast = () => {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    return () => {
      const idx = listeners.indexOf(setCurrentToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    notify(toasts.filter((t) => t.id !== id));
  }, []);

  return { toasts: currentToasts, dismiss };
};
