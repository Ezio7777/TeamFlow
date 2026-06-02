import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { useCreateTeam, useJoinTeam } from '@/hooks/useTeam';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const createSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().default(''),
});

const joinSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

type CreateFormData = z.infer<typeof createSchema>;
type JoinFormData = z.infer<typeof joinSchema>;

export default function OnboardingPage() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();

  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });
  const joinForm = useForm<JoinFormData>({ resolver: zodResolver(joinSchema) });

  const handleCreate = async (data: CreateFormData) => {
    await createTeam.mutateAsync(data);
    await refreshUser();
    navigate('/dashboard');
  };

  const handleJoin = async (data: JoinFormData) => {
    await joinTeam.mutateAsync({ teamId: data.teamId });
    await refreshUser();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary/15 items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Set up your workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">Create a new team or join an existing one</p>
        </div>

        {mode === 'choose' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('create')}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Create Team</p>
                <p className="text-xs text-muted-foreground mt-0.5">Start fresh as admin</p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Join Team</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enter an existing team</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Create a new team</h2>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Team Name</label>
                <Input {...createForm.register('name')} placeholder="e.g. Acme Engineering" autoFocus />
                {createForm.formState.errors.name && (
                  <p className="text-xs text-red-400">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
                <Textarea {...createForm.register('description')} placeholder="What does your team work on?" rows={3} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setMode('choose')} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={createTeam.isPending}>
                  {createTeam.isPending ? 'Creating...' : 'Create Team'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-1">Join an existing team</h2>
            <p className="text-sm text-muted-foreground mb-4">Ask your team admin for the Team ID.</p>
            <form onSubmit={joinForm.handleSubmit(handleJoin)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Team ID</label>
                <Input {...joinForm.register('teamId')} placeholder="e.g. 65f3a1b2c3d4e5f6a7b8c9d0" autoFocus className="font-mono text-sm" />
                {joinForm.formState.errors.teamId && (
                  <p className="text-xs text-red-400">{joinForm.formState.errors.teamId.message}</p>
                )}
              </div>
              {joinTeam.isError && (
                <div className="rounded-lg bg-red-500/10 border border-red-800/40 px-3 py-2">
                  <p className="text-xs text-red-400">{(joinTeam.error as Error)?.message}</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setMode('choose')} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={joinTeam.isPending}>
                  {joinTeam.isPending ? 'Joining...' : 'Join Team'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
