export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: string | Team | null;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface Team {
  _id: string;
  name: string;
  description: string;
  adminId: string | User;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  teamId: string;
  createdBy: User;
  taskStats?: {
    todo: number;
    'in-progress': number;
    done: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: Project | string;
  assignedTo: User | null;
  createdBy: User;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  content: string;
  senderId: User;
  teamId: string;
  timestamp: string;
  createdAt: string;
}

export interface Activity {
  _id: string;
  type: string;
  description: string;
  userId: User;
  teamId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TeamStats {
  totalProjects: number;
  taskStats: {
    todo: number;
    'in-progress': number;
    done: number;
    total: number;
  };
  recentActivity: Activity[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages?: number;
  hasMore?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface OnlineUser {
  userId: string;
  name: string;
  socketId: string;
}
