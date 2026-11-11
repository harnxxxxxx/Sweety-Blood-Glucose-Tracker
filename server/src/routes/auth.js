import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth, cookieOptions } from '../middleware/requireAuth.js';

const router = Router();
const SALT_ROUNDS = 12;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

router.post('/register', async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || name.length > 100) {
      return res.status(400).json({ error: 'Name is required and must be 100 characters or fewer.' });
    }
    if (!emailPattern.test(email) || email.length > 255) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash],
    );

    const user = publicUser(result.rows[0]);
    res.cookie('sweety_token', createToken(user.id), cookieOptions());
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    const account = result.rows[0];
    const passwordMatches = account ? await bcrypt.compare(password, account.password_hash) : false;

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = publicUser(account);
    res.cookie('sweety_token', createToken(user.id), cookieOptions());
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('sweety_token', cookieOptions());
  return res.json({ message: 'Logged out successfully.' });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.user.id],
    );
    if (!result.rows[0]) {
      res.clearCookie('sweety_token', cookieOptions());
      return res.status(401).json({ error: 'Account not found. Please log in again.' });
    }
    return res.json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
