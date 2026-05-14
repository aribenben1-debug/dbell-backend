import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config — save to disk with unique filename
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

// Helper — build public URL for uploaded file
function fileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

// ─── POST /api/upload/temp ──────────────────────────────────────────
// Upload photos before a booking exists (e.g. problem photos in wizard)
// Returns array of URLs — caller stores them and sends with booking creation
router.post('/temp', authenticate, upload.array('photos', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded' });
  }
  const urls = req.files.map((f) => fileUrl(req, f.filename));
  res.json({ urls });
});

// ─── POST /api/upload/avatar ────────────────────────────────────────
// Upload / replace profile photo for the logged-in user
router.post('/avatar', authenticate, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const url = fileUrl(req, req.file.filename);

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: url },
  });

  res.json({ avatarUrl: url });
});

// ─── POST /api/upload/job/:bookingId ────────────────────────────────
// Provider uploads job photos (up to 5 per booking)
router.post('/job/:bookingId', authenticate, upload.array('photos', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded' });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    include: { provider: true },
  });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.provider.userId !== req.user.id) {
    return res.status(403).json({ error: 'Only the provider can upload job photos' });
  }

  const existing = booking.jobPhotos ? JSON.parse(booking.jobPhotos) : [];
  const newUrls = req.files.map((f) => fileUrl(req, f.filename));
  const combined = [...existing, ...newUrls].slice(-10); // keep last 10

  const updated = await prisma.booking.update({
    where: { id: req.params.bookingId },
    data: { jobPhotos: JSON.stringify(combined) },
  });

  res.json({ jobPhotos: combined });
});

export default router;
