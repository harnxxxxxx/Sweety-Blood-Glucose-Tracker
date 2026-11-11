# Sweety 💚

A diabetes glucose-tracking app. This first milestone implements **account registration, login, logout, and authenticated session identity**. Daily glucose entries (up to four per day) and daily/monthly reports are planned for later milestones.

## Stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL 16
- **Authentication:** bcrypt password hashing + signed JWT in an HTTP-only cookie

## What's included in milestone 1

- Register with name, email, and password.
- Log in with email and password.
- Passwords are hashed with bcrypt (12 salt rounds); plain-text passwords are never persisted.
- Case-insensitive unique email addresses.
- Authenticated `/api/auth/me` endpoint restores the signed-in session.
- Logout clears the session cookie.
- Protected API middleware attaches the verified user ID from the server-signed token. Future reading queries must always filter by this ID.
- Rate limiting on authentication routes, Helmet security headers, parameterized SQL, and HTTP-only session cookies.

## Run locally

### 1. Requirements

Install Node.js 20+ and Docker Desktop (or a local PostgreSQL 16 server).

### 2. Environment

```bash
cp .env.example server/.env
```

Edit `server/.env` and set `JWT_SECRET` to a random secret of at least 32 characters. Example generator:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start PostgreSQL

From the project root:

```bash
docker compose up -d db
```

The database schema is loaded automatically on the first volume initialization. If you already had a previous database volume, run `docker compose down -v` and then `docker compose up -d db` to recreate it (this deletes the local development database data).

### 4. Install and run

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

- React app: http://localhost:5173
- Express API: http://localhost:4000
- Health check: http://localhost:4000/api/health

## API endpoints

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Create account and sign in |
| POST | `/api/auth/login` | No | Verify credentials and sign in |
| POST | `/api/auth/logout` | No | Clear session cookie |
| GET | `/api/auth/me` | Yes | Return the current user's safe profile |
| GET | `/api/private` | Yes | Example protected route |
| GET | `/api/health` | No | API health check |

### Example registration payload

```json
{
  "name": "Asha Kumar",
  "email": "asha@example.com",
  "password": "a-strong-password"
}
```

The API returns a safe user object (`id`, `name`, `email`) and sets an HTTP-only `sweety_token` cookie. The JWT is not exposed to frontend JavaScript or stored in localStorage.

## Security notes

- Never commit `.env` files or production credentials.
- Use HTTPS in production so secure cookies are enabled.
- Set a unique, high-entropy `JWT_SECRET` in every deployed environment.
- The database role should have only the permissions the app needs.
- When glucose readings are introduced, every read/update/delete query must include `WHERE user_id = req.user.id`; never trust a user ID supplied by the browser.
- This is an early application milestone, not a medical device. Glucose values and reports must not replace advice from a qualified clinician.

## Roadmap

1. **Authentication (this commit):** signup/login and user isolation foundation.
2. Glucose readings: create up to four dated readings per user per day.
3. Daily and monthly reports.
4. Validation, automated tests, deployment, and production hardening.
