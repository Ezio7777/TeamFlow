import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, usersApi } from '@/api';
import { toast } from '@/hooks/useToast';

export const useTeam = () => {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => teamApi.get().then((r) => r.data.data),
    staleTime: 60_000,
  });
};

export const useTeamStats = () => {
  return useQuery({
    queryKey: ['team-stats'],
    queryFn: () => teamApi.getStats().then((r) => r.data.data),
    staleTime: 30_000,
  });
};

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => usersApi.getTeamMembers().then((r) => r.data.data),
    staleTime: 60_000,
  });
};

export const useCreateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast({ title: 'Team created!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
};

export const useJoinTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamApi.join,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast({ title: 'Joined team!' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
};

export const useUpdateMemberRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamApi.updateMemberRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast({ title: 'Role updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
};
