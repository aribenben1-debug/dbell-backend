import { Router } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for a booking
router.post('/create-intent', authenticate, requireRole('CUSTOMER'), async (req, res) => {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (booking.paymentStatus === 'PAID') {
    return res.status(400).json({ error: 'Already paid' });
  }

  const amount = Math.round((booking.finalPrice || booking.estimatedMax) * 100); // cents

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { bookingId },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { stripePaymentIntentId: intent.id },
  });

  res.json({ clientSecret: intent.client_secret });
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook signature failed');
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const bookingId = intent.metadata?.bookingId;
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'PAID' },
      });
    }
  }

  res.json({ received: true });
});

export default router;
