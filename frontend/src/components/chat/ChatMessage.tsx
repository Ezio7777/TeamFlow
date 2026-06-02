import { Avatar } from '@/components/common/Avatar';
import type { Message } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const sender = message.senderId;
  const time = format(new Date(message.timestamp || message.createdAt), 'HH:mm');

  return (
    <div className={cn('flex gap-2.5 group', isOwn && 'flex-row-reverse')}>
      <Avatar name={sender?.name || 'U'} src={sender?.avatar} size="sm" className="shrink-0 mt-0.5" />
      <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
        <div className={cn('flex items-baseline gap-2 mb-1', isOwn && 'flex-row-reverse')}>
          <span className="text-xs font-medium">{isOwn ? 'You' : sender?.name}</span>
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </span>
        </div>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border rounded-tl-sm'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
