import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, User } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { useTasks } from '@/hooks/useTasks';
import { useTeamMembers } from '@/hooks/useTeam';
import { useProjects } from '@/hooks/useProjects';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'Create task "Fix login bug" and assign to John',
  'Show all pending tasks',
  'Move task "API docs" to done',
  'Show tasks assigned to me',
];

function parseCommand(input: string) {
  const lower = input.toLowerCase().trim();

  const createMatch = lower.match(/create\s+task\s+"([^"]+)"(?:\s+(?:and\s+)?assign\s+to\s+(\w+))?/i)
    || lower.match(/add\s+task\s+"([^"]+)"(?:\s+(?:and\s+)?assign\s+to\s+(\w+))?/i);
  if (createMatch) return { action: 'create', title: createMatch[1], assigneeName: createMatch[2] };

  const moveMatch = lower.match(/move\s+task\s+"([^"]+)"\s+to\s+(todo|done|in.progress|in-progress)/i)
    || lower.match(/mark\s+"([^"]+)"\s+as\s+(todo|done|in.progress|in-progress)/i);
  if (moveMatch) {
    let status = moveMatch[2].replace(/\s+/g, '-').toLowerCase();
    if (status === 'in.progress') status = 'in-progress';
    return { action: 'move', title: moveMatch[1], status };
  }

  const assignMatch = lower.match(/assign\s+task\s+"([^"]+)"\s+to\s+(\w+)/i);
  if (assignMatch) return { action: 'assign', title: assignMatch[1], assigneeName: assignMatch[2] };

  if (lower.includes('pending') || lower.includes('todo') || lower.includes('all tasks')) {
    const statusFilter = lower.includes('pending') || lower.includes('todo') ? 'todo'
      : lower.includes('in progress') ? 'in-progress'
      : lower.includes('done') ? 'done' : 'all';
    return { action: 'list', statusFilter };
  }

  if (lower.includes('my tasks') || lower.includes('assigned to me')) {
    return { action: 'list_mine' };
  }

  if (lower.includes('help')) return { action: 'help' };

  return { action: 'unknown' };
}

export function AssistantPanel() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm your TeamFlow assistant. I can help you manage tasks using natural language.\n\nTry saying:\n• Create task \"Fix the header\" and assign to Alice\n• Move task \"Deploy backend\" to done\n• Show all pending tasks",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: tasksData } = useTasks();
  const { data: members } = useTeamMembers();
  const { data: projectsData } = useProjects();
  const qc = useQueryClient();

  const tasks = tasksData?.tasks || [];
  const projects = projectsData?.projects || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role, content, timestamp: new Date() }]);
  };

  const handleCommand = async (commandText: string) => {
    setProcessing(true);
    const cmd = parseCommand(commandText);

    try {
      if (cmd.action === 'create') {
        if (projects.length === 0) {
          addMessage('assistant', "⚠️ You need to create a project first before adding tasks.");
          return;
        }

        let assignedTo: string | null = null;
        if (cmd.assigneeName && members) {
          const member = members.find((m) =>
            m.name.toLowerCase().includes(cmd.assigneeName!.toLowerCase())
          );
          if (member) assignedTo = member._id;
          else addMessage('assistant', `ℹ️ I couldn't find a team member named "${cmd.assigneeName}". Creating task unassigned.`);
        }

        const defaultProject = projects[0];
        await createTask.mutateAsync({
          title: cmd.title!,
          projectId: defaultProject._id,
          assignedTo,
        });

        const assignMsg = assignedTo
          ? ` and assigned to ${members?.find((m) => m._id === assignedTo)?.name}`
          : '';
        addMessage('assistant', `✅ Task **"${cmd.title}"** created in **${defaultProject.name}**${assignMsg}.`);
      }

      else if (cmd.action === 'move') {
        const task = tasks.find((t) =>
          t.title.toLowerCase().includes(cmd.title!.toLowerCase())
        );
        if (!task) {
          addMessage('assistant', `❌ I couldn't find a task matching **"${cmd.title}"**. Check the exact title.`);
          return;
        }
        await updateTask.mutateAsync({ id: task._id, data: { status: cmd.status } });
        const statusLabel = cmd.status === 'in-progress' ? 'In Progress' : cmd.status === 'done' ? 'Done' : 'Todo';
        addMessage('assistant', `✅ Moved **"${task.title}"** to **${statusLabel}**.`);
      }

      else if (cmd.action === 'assign') {
        const task = tasks.find((t) =>
          t.title.toLowerCase().includes(cmd.title!.toLowerCase())
        );
        if (!task) {
          addMessage('assistant', `❌ Couldn't find task **"${cmd.title}"**.`);
          return;
        }
        const member = members?.find((m) =>
          m.name.toLowerCase().includes(cmd.assigneeName!.toLowerCase())
        );
        if (!member) {
          addMessage('assistant', `❌ Couldn't find team member **"${cmd.assigneeName}"**.`);
          return;
        }
        await updateTask.mutateAsync({ id: task._id, data: { assignedTo: member._id } });
        addMessage('assistant', `✅ Task **"${task.title}"** assigned to **${member.name}**.`);
      }

      else if (cmd.action === 'list') {
        const filtered = cmd.statusFilter === 'all'
          ? tasks
          : tasks.filter((t) => t.status === cmd.statusFilter);

        if (filtered.length === 0) {
          addMessage('assistant', `📋 No tasks found${cmd.statusFilter !== 'all' ? ` with status **${cmd.statusFilter}**` : ''}.`);
          return;
        }

        const list = filtered
          .slice(0, 10)
          .map((t) => `• **${t.title}** — ${t.status}${t.assignedTo ? ` (${t.assignedTo.name})` : ''}`)
          .join('\n');
        const suffix = filtered.length > 10 ? `\n…and ${filtered.length - 10} more tasks.` : '';
        addMessage('assistant', `📋 Found **${filtered.length}** task(s):\n\n${list}${suffix}`);
      }

      else if (cmd.action === 'list_mine') {
        addMessage('assistant', "📋 Head to the **Tasks** page to see your assigned tasks, filtered by your account.");
      }

      else if (cmd.action === 'help') {
        addMessage('assistant', `Here's what I can do:\n\n**Create tasks:**\n• Create task "Title" and assign to Name\n\n**Move tasks:**\n• Move task "Title" to done/todo/in-progress\n\n**Assign tasks:**\n• Assign task "Title" to Name\n\n**List tasks:**\n• Show all pending tasks\n• Show tasks in progress`);
      }

      else {
        addMessage('assistant', `I'm not sure how to help with that. Try:\n• Create task "Fix bug" and assign to Alice\n• Move task "Deploy" to done\n• Show all pending tasks\n\nType **help** for more commands.`);
      }
    } catch (err) {
      addMessage('assistant', `⚠️ Something went wrong: ${(err as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || processing) return;
    const text = input.trim();
    setInput('');
    addMessage('user', text);
    await handleCommand(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < content.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">TeamFlow Assistant</h2>
          <p className="text-xs text-muted-foreground">Natural language task management</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              msg.role === 'assistant' ? 'bg-primary/15 text-primary' : 'bg-secondary text-secondary-foreground'
            )}>
              {msg.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </div>
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              msg.role === 'assistant'
                ? 'bg-card border border-border rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm'
            )}>
              {renderContent(msg.content)}
            </div>
          </div>
        ))}

        {processing && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Processing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border space-y-2 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            disabled={processing}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || processing} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
