import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  sendEmail,
  bookingConfirmationEmail,
  newBookingProviderEmail,
  bookingStatusEmail,
} from '../lib/email.js';

const router = Router();

const createSchema = z.object({
  providerId: z.string(),
  tradeId: z.string(),
  description: z.string().min(10),
  answers: z.record(z.any()),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  durationHours: z.number().min(0.5).default(1),
  address: z.string(),
  city: z.string(),
  problemPhotos: z.array(z.string()).optional(),
});

// Calculate price estimate ±20%
function calcEstimate(hourlyRate, hours) {
  const base = hourlyRate * hours;
  return {
    estimatedMin: parseFloat((base * 0.8).toFixed(2)),
    estimatedMax: parseFloat((base * 1.2).toFixed(2)),
  };
}

// Customer creates a booking
router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { providerId, tradeId, description, answers, scheduledDate, scheduledTime, durationHours, address, city, problemPhotos } =
    parsed.data;

  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider || provider.status !== 'APPROVED') {
    return res.status(404).json({ error: 'Provider not found' });
  }

  const { estimatedMin, estimatedMax } = calcEstimate(provider.baseHourlyRate, durationHours);

  const booking = await prisma.booking.create({
    data: {
      customerId: req.user.id,
      providerId,
      tradeId,
      description,
      answers: JSON.stringify(answers),
      problemPhotos: problemPhotos?.length ? JSON.stringify(problemPhotos) : null,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      durationHours,
      address,
      city,
      estimatedMin,
      estimatedMax,
    },
    include: {
      provider: { include: { user: { select: { firstName: true, lastName: true } } } },
      trade: true,
    },
  });

  // Email: confirm to customer + alert to provider (fire & forget)
  try {
    const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
    const providerUser = await prisma.user.findUnique({ where: { id: booking.provider.userId } });
    const tradeName = booking.trade.name;

    if (customer) {
      sendEmail(
        customer.email,
        bookingConfirmationEmail(
          customer.firstName,
          booking,
          `${booking.provider.user.firstName} ${booking.provider.user.lastName}`,
          tradeName
        )
      );
    }
    if (providerUser) {
      sendEmail(
        providerUser.email,
        newBookingProviderEmail(
          providerUser.firstName,
          `${customer?.firstName} ${customer?.lastName}`,
          booking,
          tradeName
        )
      );
    }
  } catch (emailErr) {
    console.error('[EMAIL] booking creation email error:', emailErr.message);
  }

  res.status(201).json(booking);
});

// List bookings for the authenticated user
router.get('/', authenticate, async (req, res) => {
  const { status } = req.query;
  const isCustomer = req.user.role === 'CUSTOMER';
  const isProvider = req.user.role === 'PROVIDER';

  let whereClause = {};
  if (isCustomer) whereClause.customerId = req.user.id;
  if (isProvider) {
    const provider = await prisma.provider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.json([]);
    whereClause.providerId = provider.id;
  }
  if (status) whereClause.status = status;

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
      provider: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      trade: true,
      review: true,
    },
    orderBy: { scheduledDate: 'desc' },
  });

  res.json(bookings);
});

// Get single booking
router.get('/:id', authenticate, async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
      provider: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      trade: true,
      messages: {
        include: { sender: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
      review: true,
    },
  });

  if (!booking) return res.status(404).json({ error: 'Not found' });

  const isParty =
    booking.customerId === req.user.id ||
    booking.provider.userId === req.user.id ||
    req.user.role === 'ADMIN';

  if (!isParty) return res.status(403).json({ error: 'Forbidden' });

  res.json(booking);
});

// Update booking status (provider confirms / cancels; customer cancels)
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowed = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { provider: true },
  });
  if (!booking) return res.status(404).json({ error: 'Not found' });

  const isCustomer = booking.customerId === req.user.id;
  const isProvider = booking.provider.userId === req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isCustomer && !isProvider && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status },
    include: { trade: true },
  });

  // Email the customer when status changes to CONFIRMED / COMPLETED / CANCELLED
  try {
    const customer = await prisma.user.findUnique({ where: { id: booking.customerId } });
    const emailTemplate = bookingStatusEmail(
      customer?.firstName || 'there',
      status,
      updated,
      updated.trade?.name || 'service'
    );
    if (customer && emailTemplate) {
      sendEmail(customer.email, emailTemplate);
    }
  } catch (emailErr) {
    console.error('[EMAIL] status update email error:', emailErr.message);
  }

  res.json(updated);
});

// Set final price (provider only, after job)
router.patch('/:id/price', authenticate, requireRole('PROVIDER'), async (req, res) => {
  const { finalPrice } = req.body;
  if (!finalPrice) return res.status(400).json({ error: 'finalPrice required' });

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { provider: true },
  });

  if (!booking || booking.provider.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { finalPrice: parseFloat(finalPrice) },
  });

  res.json(updated);
});

// Submit a review (customer only, booking must be COMPLETED)
router.post('/:id/review', authenticate, requireRole('CUSTOMER'), async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking || booking.customerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (booking.status !== 'COMPLETED') return res.status(400).json({ error: 'Booking not completed' });

  const review = await prisma.review.create({
    data: { bookingId: req.params.id, rating, comment },
  });

  // Recalculate provider rating
  const reviews = await prisma.review.findMany({
    where: { booking: { providerId: booking.providerId } },
  });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await prisma.provider.update({
    where: { id: booking.providerId },
    data: { rating: parseFloat(avg.toFixed(2)), reviewCount: reviews.length },
  });

  res.status(201).json(review);
});

export default router;
