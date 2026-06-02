import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, CheckSquare, Clock, CheckCircle2,
  TrendingUp, Plus, ArrowRight, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamStats } from '@/hooks/useTeam';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton, CardSkeleton } from '@/components/common/Skeleton';
import { Avatar } from '@/components/common/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            )}
          </div>
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useTeamStats();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();

  const recentProjects = projectsData?.projects?.slice(0, 3) || [];
  const myTasks = tasksData?.tasks?.filter((t) => t.assignedTo?._id === user?._id).slice(0, 5) || [];

  const completionRate = stats?.taskStats.total
    ? Math.round((stats.taskStats.done / stats.taskStats.total) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening with your team today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          label="Total Projects"
          value={stats?.totalProjects ?? 0}
          color="bg-blue-500/15 text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckSquare}
          label="Total Tasks"
          value={stats?.taskStats.total ?? 0}
          color="bg-violet-500/15 text-violet-400"
          loading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={stats?.taskStats['in-progress'] ?? 0}
          color="bg-amber-500/15 text-amber-400"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats?.taskStats.done ?? 0}
          color="bg-emerald-500/15 text-emerald-400"
          loading={statsLoading}
        />
      </div>

      {/* Progress bar */}
      {!statsLoading && stats && stats.taskStats.total > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Overall Progress</span>
              </div>
              <span className="text-sm font-semibold text-primary">{completionRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span>{stats.taskStats.todo} todo</span>
              <span className="text-amber-400">{stats.taskStats['in-progress']} in progress</span>
              <span className="text-emerald-400">{stats.taskStats.done} done</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Projects</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/projects')}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {projectsLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : recentProjects.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('/projects')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recentProjects.map((project) => {
                const stats = project.taskStats || { todo: 0, 'in-progress': 0, done: 0, total: 0 };
                const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                return (
                  <Card
                    key={project._id}
                    className="cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-medium text-sm truncate">{project.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{stats.done}/{stats.total} tasks</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', progress === 100 ? 'bg-emerald-500' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity & My Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">My Tasks</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/tasks')}>
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {tasksLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : myTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No tasks assigned to you</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {myTasks.map((task) => (
                    <li
                      key={task._id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate('/tasks')}
                    >
                      <div className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        task.status === 'done' ? 'bg-emerald-500'
                          : task.status === 'in-progress' ? 'bg-amber-400'
                          : 'bg-muted-foreground/50'
                      )} />
                      <span className={cn(
                        'text-sm flex-1 truncate',
                        task.status === 'done' && 'line-through text-muted-foreground'
                      )}>
                        {task.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              {statsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (stats?.recentActivity?.length ?? 0) === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {stats!.recentActivity.slice(0, 6).map((activity) => (
                    <li key={activity._id} className="flex items-start gap-3 px-4 py-3">
                      <Avatar name={activity.userId?.name || 'U'} src={activity.userId?.avatar} size="sm" className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
