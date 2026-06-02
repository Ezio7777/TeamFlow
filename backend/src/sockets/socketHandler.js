const admin = require('firebase-admin');
const User = require('../models/User');

const onlineUsers = new Map();

const setupSockets = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decoded.uid }).lean();

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const teamId = user.teamId?.toString();

    if (teamId) {
      socket.join(`team:${teamId}`);
      onlineUsers.set(user._id.toString(), { userId: user._id, name: user.name, socketId: socket.id });

      User.findByIdAndUpdate(user._id, { isOnline: true }).exec();

      socket.to(`team:${teamId}`).emit('user:online', { userId: user._id, name: user.name });

      const teamOnlineUsers = Array.from(onlineUsers.values()).filter((u) => {
        const userIds = Array.from(onlineUsers.keys());
        return true;
      });
      socket.emit('users:online_list', Array.from(onlineUsers.values()));
    }

    socket.on('chat:typing_start', () => {
      if (teamId) {
        socket.to(`team:${teamId}`).emit('chat:typing_start', { userId: user._id, name: user.name });
      }
    });

    socket.on('chat:typing_stop', () => {
      if (teamId) {
        socket.to(`team:${teamId}`).emit('chat:typing_stop', { userId: user._id });
      }
    });

    socket.on('task:drag_update', (data) => {
      if (teamId) {
        socket.to(`team:${teamId}`).emit('task:drag_update', data);
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(user._id.toString());
      User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() }).exec();

      if (teamId) {
        socket.to(`team:${teamId}`).emit('user:offline', { userId: user._id });
      }
    });
  });
};

module.exports = setupSockets;
