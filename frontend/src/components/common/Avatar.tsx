import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-500/20 text-blue-400',
    'bg-violet-500/20 text-violet-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-amber-500/20 text-amber-400',
    'bg-rose-500/20 text-rose-400',
    'bg-cyan-500/20 text-cyan-400',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ name, src, size = 'md', online, className }: AvatarProps) {
  return (
    <div className="relative inline-flex">
      <AvatarPrimitive.Root
        className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizeMap[size], className)}
      >
        {src && (
          <AvatarPrimitive.Image src={src} alt={name} className="aspect-square h-full w-full object-cover" />
        )}
        <AvatarPrimitive.Fallback
          className={cn('flex h-full w-full items-center justify-center rounded-full font-medium', getAvatarColor(name))}
        >
          {getInitials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full border-2 border-background',
            size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            online ? 'bg-emerald-500' : 'bg-muted-foreground/50'
          )}
        />
      )}
    </div>
  );
}
