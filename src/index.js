import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import providerRoutes from './routes/providers.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import paymentRoutes from './routes/payments.js';
import supportRoutes from './routes/support.js';
import tradeRoutes from './routes/trades.js';
import uploadRoutes from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// Stripe webhook needs raw body — must come before json middleware
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Global error handler — logs the real error
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

initSocket(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`D-Bell server running on port ${PORT}`));

export { io };
