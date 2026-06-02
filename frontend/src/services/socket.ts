import { io, Socket } from 'socket.io-client';
import { auth } from '@/lib/firebase';

let socket: Socket | null = null;

export const getSocket = () => socket;

export const connectSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket;

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No auth token');

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
