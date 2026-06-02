import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, CheckSquare, MessageSquare,
  Users, Bot, LogOut, Menu, X, Zap
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { useSocket } from '@/contexts/SocketContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/chat', icon: MessageSquare, label: 'Team Chat' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/assistant', icon: Bot, label: 'Assistant' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border shrink-0">
        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground">TeamFlow</span>
        {connected && (
          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" title="Connected" />
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-card border-r border-border z-50 animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">TeamFlow</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
