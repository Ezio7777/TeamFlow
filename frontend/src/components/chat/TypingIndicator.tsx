interface TypingIndicatorProps {
  typingUsers: Array<{ userId: string; name: string }>;
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.slice(0, 2).map((u) => u.name.split(' ')[0]);
  const label =
    typingUsers.length === 1
      ? `${names[0]} is typing`
      : typingUsers.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <div className="flex gap-0.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
