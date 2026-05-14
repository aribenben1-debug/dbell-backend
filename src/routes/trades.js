import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  const trades = await prisma.trade.findMany({ orderBy: { name: 'asc' } });
  res.json(trades);
});

export default router;
