import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';
import readingsRouter from './routes/readings.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Sweety API' }));
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/readings', readingsRouter);

// Protected route confirms the server-side identity boundary for future user data APIs.
app.get('/api/private', requireAuth, (req, res) => {
  res.json({ userId: req.user.id, message: 'You are authenticated.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

