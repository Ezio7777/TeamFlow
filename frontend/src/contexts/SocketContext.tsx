import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { useAuth } from './AuthContext';
import type { OnlineUser } from '@/types';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: OnlineUser[];
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  onlineUsers: [],
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!firebaseUser || !user?.teamId) return;

    connectSocket()
      .then((s) => {
        socketRef.current = s;

        s.on('connect', () => setConnected(true));
        s.on('disconnect', () => setConnected(false));

        s.on('users:online_list', (users: OnlineUser[]) => setOnlineUsers(users));
        s.on('user:online', (u: OnlineUser) => {
          setOnlineUsers((prev) => {
            const exists = prev.find((x) => x.userId === u.userId);
            return exists ? prev : [...prev, u];
          });
        });
        s.on('user:offline', ({ userId }: { userId: string }) => {
          setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
        });
      })
      .catch(console.error);

    return () => {
      disconnectSocket();
      setConnected(false);
      setOnlineUsers([]);
    };
  }, [firebaseUser, user?.teamId]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
