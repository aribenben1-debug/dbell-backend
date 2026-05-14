import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendEmail, providerApprovedEmail } from '../lib/email.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

// List providers by status
router.get('/providers', async (req, res) => {
  const { status } = req.query;
  const providers = await prisma.provider.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
      trades: true,
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(providers);
});

// Approve or reject a provider
router.patch('/providers/:id', async (req, res) => {
  const { status } = req.body;
  if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data: { status },
    include: { user: { select: { email: true, firstName: true } } },
  });

  // Email the provider when approved
  if (status === 'APPROVED' && provider.user) {
    sendEmail(provider.user.email, providerApprovedEmail(provider.user.firstName));
  }

  res.json(provider);
});

// List all bookings
router.get('/bookings', async (req, res) => {
  const { status } = req.query;
  const bookings = await prisma.booking.findMany({
    where: status ? { status } : undefined,
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      provider: { include: { user: { select: { firstName: true, lastName: true } } } },
      trade: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bookings);
});

// Dashboard stats
router.get('/stats', async (_req, res) => {
  const [users, providers, bookings, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.provider.count({ where: { status: 'APPROVED' } }),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { finalPrice: true },
    }),
  ]);

  res.json({
    totalUsers: users,
    approvedProviders: providers,
    totalBookings: bookings,
    totalRevenue: revenue._sum.finalPrice || 0,
  });
});

// List all users
router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      phone: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// Seed trades (admin utility)
router.post('/trades/seed', async (_req, res) => {
  const trades = [
    { name: 'Plumber', slug: 'plumber', icon: '🔧' },
    { name: 'Electrician', slug: 'electrician', icon: '⚡' },
    { name: 'Handyman', slug: 'handyman', icon: '🛠️' },
    { name: 'Painter', slug: 'painter', icon: '🖌️' },
    { name: 'Carpenter', slug: 'carpenter', icon: '🪵' },
    { name: 'HVAC Technician', slug: 'hvac', icon: '❄️' },
    { name: 'Locksmith', slug: 'locksmith', icon: '🔑' },
    { name: 'Cleaner', slug: 'cleaner', icon: '🧹' },
    { name: 'Gardener', slug: 'gardener', icon: '🌱' },
    { name: 'Pest Control', slug: 'pest-control', icon: '🐛' },
  ];

  await prisma.trade.createMany({ data: trades, skipDuplicates: true });
  res.json({ seeded: trades.length });
});

export default router;
