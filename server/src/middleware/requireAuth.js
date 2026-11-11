import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.sweety_token;
  if (!token) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    return next();
  } catch {
    res.clearCookie('sweety_token', cookieOptions());
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

export function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  };
}
