import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { messagesApi } from '@/api';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Skeleton } from '@/components/common/Skeleton';
import type { Message } from '@/types';
import { useTeam } from '@/hooks/useTeam';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { data: teamData } = useTeam();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; name: string }>>([]);
  const [showMembers, setShowMembers] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    messagesApi.getAll({ limit: 50 }).then((res) => {
      setMessages(res.data.data.messages);
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 50);
    }).catch(() => setLoading(false));
  }, [scrollToBottom]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    });

    socket.on('chat:typing_start', (data: { userId: string; name: string }) => {
      if (data.userId === user?._id) return;
      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === data.userId);
        return exists ? prev : [...prev, data];
      });
    });

    socket.on('chat:typing_stop', (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    return () => {
      socket.off('message:new');
      socket.off('chat:typing_start');
      socket.off('chat:typing_stop');
    };
  }, [socket, user?._id, scrollToBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket?.emit('chat:typing_start');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('chat:typing_stop');
    }, 1500);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    socket?.emit('chat:typing_stop');
    setSending(true);

    try {
      await messagesApi.send({ content });
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const members = teamData?.members || [];
  const onlineUserIds = new Set(onlineUsers.map((u) => u.userId));

  return (
    <div className="flex h-full">
      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-sm"># team-general</h2>
            <p className="text-xs text-muted-foreground">
              {onlineUsers.length} member{onlineUsers.length !== 1 ? 's' : ''} online
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs lg:hidden"
            onClick={() => setShowMembers((v) => !v)}
          >
            <Users className="h-4 w-4" />
            Members
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn('flex gap-2.5', i % 2 === 0 && 'flex-row-reverse')}>
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <Skeleton className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-64')} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Send className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to say hello!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg._id}
                message={msg}
                isOwn={msg.senderId?._id === user?._id}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="px-5 py-1">
            <TypingIndicator typingUsers={typingUsers} />
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message #team-general..."
              disabled={sending}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Members sidebar */}
      <div className={cn(
        'border-l border-border bg-card w-56 shrink-0 flex-col',
        'hidden lg:flex',
        showMembers && '!flex fixed right-0 top-0 h-full z-30 shadow-lg'
      )}>
        <div className="px-4 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold">Team Members</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{members.length} total</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {/* Online */}
          {members.filter((m) => onlineUserIds.has(m._id)).length > 0 && (
            <>
              <p className="text-xs text-muted-foreground/70 font-medium px-2 py-1.5 uppercase tracking-wider">
                Online — {members.filter((m) => onlineUserIds.has(m._id)).length}
              </p>
              {members.filter((m) => onlineUserIds.has(m._id)).map((member) => (
                <div key={member._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                  <Avatar name={member.name} src={member.avatar} size="sm" online={true} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {member._id === user?._id ? `${member.name} (you)` : member.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </>
          )}
          {/* Offline */}
          {members.filter((m) => !onlineUserIds.has(m._id)).length > 0 && (
            <>
              <p className="text-xs text-muted-foreground/70 font-medium px-2 py-1.5 uppercase tracking-wider mt-2">
                Offline
              </p>
              {members.filter((m) => !onlineUserIds.has(m._id)).map((member) => (
                <div key={member._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg opacity-60">
                  <Avatar name={member.name} src={member.avatar} size="sm" online={false} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
