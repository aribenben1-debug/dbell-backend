import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { subject, body, bookingId } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'subject and body required' });

  const ticket = await prisma.supportTicket.create({
    data: { userId: req.user.id, subject, body, bookingId },
  });
  res.status(201).json(ticket);
});

router.get('/', authenticate, async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const tickets = await prisma.supportTicket.findMany({
    where: isAdmin ? undefined : { userId: req.user.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      booking: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tickets);
});

router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { status } = req.body;
  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(ticket);
});

export default router;
