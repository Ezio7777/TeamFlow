import apiClient from './client';
import type { Project, Task, Message, Team, User, TeamStats } from '@/types';

// --- Projects ---
export const projectsApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; data: { projects: Project[]; pagination: unknown } }>('/api/projects', { params }),

  getById: (id: string) =>
    apiClient.get<{ success: boolean; data: Project }>(`/api/projects/${id}`),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<{ success: boolean; data: Project }>('/api/projects', data),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.put<{ success: boolean; data: Project }>(`/api/projects/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/projects/${id}`),
};

// --- Tasks ---
export const tasksApi = {
  getAll: (params?: {
    projectId?: string;
    status?: string;
    search?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<{ success: boolean; data: { tasks: Task[]; pagination: unknown } }>('/api/tasks', { params }),

  create: (data: {
    title: string;
    description?: string;
    status?: string;
    projectId: string;
    assignedTo?: string | null;
    priority?: string;
    dueDate?: string | null;
  }) => apiClient.post<{ success: boolean; data: Task }>('/api/tasks', data),

  update: (id: string, data: Partial<Task> & { assignedTo?: string | null }) =>
    apiClient.put<{ success: boolean; data: Task }>(`/api/tasks/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/tasks/${id}`),
};

// --- Messages ---
export const messagesApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; data: { messages: Message[]; pagination: unknown } }>('/api/messages', { params }),

  send: (data: { content: string }) =>
    apiClient.post<{ success: boolean; data: Message }>('/api/messages', data),
};

// --- Team ---
export const teamApi = {
  get: () =>
    apiClient.get<{ success: boolean; data: { team: Team; members: User[] } }>('/api/team'),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<{ success: boolean; data: Team }>('/api/team/create', data),

  join: (data: { teamId: string }) =>
    apiClient.post<{ success: boolean; data: Team }>('/api/team/join', data),

  getStats: () =>
    apiClient.get<{ success: boolean; data: TeamStats }>('/api/team/stats'),

  updateMemberRole: (data: { userId: string; role: string }) =>
    apiClient.put('/api/team/member-role', data),

  removeMember: (userId: string) =>
    apiClient.delete(`/api/team/members/${userId}`),
};

// --- Users ---
export const usersApi = {
  register: (data: { firebaseUid: string; email: string; name: string; role?: string; teamId?: string | null }) =>
    apiClient.post<{ success: boolean; data: User }>('/api/users/register', data),

  getMe: () =>
    apiClient.get<{ success: boolean; data: User }>('/api/users/me'),

  updateMe: (data: { name?: string; avatar?: string }) =>
    apiClient.put<{ success: boolean; data: User }>('/api/users/me', data),

  getTeamMembers: () =>
    apiClient.get<{ success: boolean; data: User[] }>('/api/users/team-members'),
};
