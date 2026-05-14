import { verifyAccess } from './lib/jwt.js';
import prisma from './lib/prisma.js';

export function initSocket(io) {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.user = verifyAccess(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join booking-specific rooms
    socket.on('join-booking', (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on('leave-booking', (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    // Send a chat message
    socket.on('send-message', async ({ bookingId, content }) => {
      if (!content?.trim() || !bookingId) return;

      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { provider: true },
        });

        const isParty =
          booking?.customerId === socket.user.id ||
          booking?.provider?.userId === socket.user.id;

        if (!isParty) return;

        const message = await prisma.message.create({
          data: { bookingId, senderId: socket.user.id, content: content.trim() },
          include: {
            sender: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        });

        io.to(`booking:${bookingId}`).emit('new-message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {});
  });
}
