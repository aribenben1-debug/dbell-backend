import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Search available providers by trade + city
router.get('/search', async (req, res) => {
  const { tradeSlug, city, date } = req.query;
  if (!tradeSlug) return res.status(400).json({ error: 'tradeSlug required' });

  const dayOfWeek = date ? new Date(date).getDay() : undefined;

  console.log(`[search] tradeSlug=${tradeSlug} city=${city}`);
  // Fetch all approved providers for this trade (SQLite doesn't support mode:'insensitive')
  const all = await prisma.provider.findMany({
    where: {
      status: 'APPROVED',
      trades: { some: { slug: tradeSlug } },
    },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      trades: true,
      availability: true,
    },
    orderBy: { rating: 'desc' },
    take: 100,
  });

  // Filter by city — case-insensitive in JS
  const cityTrimmed = city?.toLowerCase().trim() || '';
  let providers = cityTrimmed
    ? all.filter((p) =>
        p.city.toLowerCase().includes(cityTrimmed) ||
        cityTrimmed.includes(p.city.toLowerCase())
      )
    : all;

  // If nothing matched the city, return everyone for this trade
  // so the user always sees results
  if (providers.length === 0) providers = all;

  console.log(`[search] all=${all.length} returning=${providers.length}`);
  res.json(providers);
});

// Get a single provider's public profile
router.get('/:id', async (req, res) => {
  const provider = await prisma.provider.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true, createdAt: true } },
      trades: true,
      availability: { where: { isActive: true } },
    },
  });
  if (!provider || provider.status !== 'APPROVED') {
    return res.status(404).json({ error: 'Provider not found' });
  }
  res.json(provider);
});

// Provider updates their own profile / availability
router.put('/me', authenticate, requireRole('PROVIDER'), async (req, res) => {
  const { bio, baseHourlyRate, serviceRadius, city, availability, trades } = req.body;

  const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
  if (!provider) return res.status(404).json({ error: 'Provider profile not found' });

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      ...(bio !== undefined && { bio }),
      ...(baseHourlyRate !== undefined && { baseHourlyRate }),
      ...(serviceRadius !== undefined && { serviceRadius }),
      ...(city !== undefined && { city }),
      ...(trades && { trades: { set: trades.map((s) => ({ slug: s })) } }),
    },
    include: { trades: true, availability: true },
  });

  if (availability) {
    for (const slot of availability) {
      await prisma.availability.upsert({
        where: { providerId_dayOfWeek: { providerId: provider.id, dayOfWeek: slot.dayOfWeek } },
        update: { startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive },
        create: {
          providerId: provider.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: slot.isActive ?? true,
        },
      });
    }
  }

  res.json(updated);
});

// Get available time slots for a provider on a given date
router.get('/:id/slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });

  const dayOfWeek = new Date(date).getDay();

  const availability = await prisma.availability.findUnique({
    where: { providerId_dayOfWeek: { providerId: req.params.id, dayOfWeek } },
  });

  if (!availability || !availability.isActive) return res.json({ slots: [] });

  // Existing bookings for that date
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const existing = await prisma.booking.findMany({
    where: {
      providerId: req.params.id,
      scheduledDate: { gte: start, lt: end },
      status: { notIn: ['CANCELLED'] },
    },
    select: { scheduledTime: true, durationHours: true },
  });

  // Generate hourly slots between start and end time
  const [startH] = availability.startTime.split(':').map(Number);
  const [endH] = availability.endTime.split(':').map(Number);
  const bookedHours = new Set(existing.map((b) => b.scheduledTime));

  const slots = [];
  for (let h = startH; h < endH; h++) {
    const time = `${String(h).padStart(2, '0')}:00`;
    slots.push({ time, available: !bookedHours.has(time) });
  }

  res.json({ slots });
});

export default router;
