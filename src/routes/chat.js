import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:bookingId/messages', authenticate, async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    include: { provider: true },
  });
  if (!booking) return res.status(404).json({ error: 'Not found' });

  const isParty =
    booking.customerId === req.user.id ||
    booking.provider.userId === req.user.id ||
    req.user.role === 'ADMIN';
  if (!isParty) return res.status(403).json({ error: 'Forbidden' });

  const messages = await prisma.message.findMany({
    where: { bookingId: req.params.bookingId },
    include: { sender: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: {
      bookingId: req.params.bookingId,
      senderId: { not: req.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  res.json(messages);
});

export default router;
