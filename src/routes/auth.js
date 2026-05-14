import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmail, welcomeCustomerEmail, welcomeProviderEmail } from '../lib/email.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
  // Provider-only fields
  city: z.string().optional(),
  baseHourlyRate: z.number().optional(),
  trades: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

function tokenPair(user) {
  const payload = { id: user.id, role: user.role, email: user.email };
  return { accessToken: signAccess(payload), refreshToken: signRefresh(payload) };
}

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { email, password, firstName, lastName, phone, role, city, baseHourlyRate, trades, bio } =
      parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName,
        lastName,
        phone,
        role,
        ...(role === 'PROVIDER' && {
          provider: {
            create: {
              city: city || '',
              baseHourlyRate: baseHourlyRate || 0,
              bio,
            },
          },
        }),
      },
      include: { provider: true },
    });

    // Send welcome email (fire & forget — don't block the response)
    if (role === 'CUSTOMER') {
      sendEmail(email, welcomeCustomerEmail(firstName));
    } else {
      sendEmail(email, welcomeProviderEmail(firstName));
    }

    res.status(201).json({ user: safeUser(user), ...tokenPair(user) });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { provider: true },
  });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ user: safeUser(user), ...tokenPair(user) });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload = verifyRefresh(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json(tokenPair(user));
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { provider: { include: { trades: true, availability: true } } },
  });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(safeUser(user));
});

export default router;
