# Sweety – Blood Glucose Tracker

Sweety is a simple blood glucose tracking application that helps users record, manage, and monitor their glucose readings in one place.

The goal of this project is to make daily glucose tracking easier through a clean and user-friendly interface. I built this project to improve my full-stack development skills and learn how frontend, backend, and database technologies work together.

## Features

- **User Authentication:** Register, log in, and log out securely.
- **Secure Password Storage:** Passwords are hashed using bcrypt.
- **Glucose Readings:** Add, view, edit, and delete glucose readings.
- **Daily Tracking:** Record up to four readings per day:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- **Input Validation:** Prevent invalid glucose values, duplicate time slots, and future dates.
- **Reading History:** View previously recorded readings with pagination.
- **Glucose Trend Chart:** View a chart of readings over the last 30 days.
- **Reports:** View daily, month-to-date, and previous-month reports with highest, lowest, and average readings.
- **User Data Protection:** Users can access only their own readings and reports.

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend development |
| Vite | Frontend development server and build tool |
| Node.js | Backend runtime |
| Express.js | REST API |
| PostgreSQL | Database |
| Docker | Running PostgreSQL locally |
| bcrypt | Password hashing |
| JWT | Authentication |
| Recharts | Glucose trend chart |
| Lucide React | Icons |

## Running the Project Locally

### Prerequisites

- Node.js 20 or later
- npm
- Docker Desktop

### 1. Clone the repository

```bash
git clone https://github.com/harnxxxxxx/Sweety-Blood-Glucose-Tracker.git
cd Sweety-Blood-Glucose-Tracker
```

### 2. Configure environment variables

Copy the example environment file:

**Windows PowerShell:**
```powershell
Copy-Item .env.example server/.env
```

Open `server/.env` and configure the required values, including your database connection and a secure `JWT_SECRET` of at least 32 characters.

Generate a random secret using:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start PostgreSQL

```bash
docker compose up -d db
```

The database schema is initialized automatically when the database volume is created for the first time.

### 4. Install dependencies

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 5. Start the application

```bash
npm run dev
```

The frontend and backend will start using the project's development scripts.

- **Frontend:** Check the Vite URL shown in the terminal (usually `http://localhost:5173`).
- **Backend:** `http://localhost:4000`
- **API Health Check:** `http://localhost:4000/api/health`

Make sure `CLIENT_ORIGIN` in `server/.env` matches the frontend URL.

## Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the logged-in user |
| GET | `/api/readings` | View glucose readings |
| POST | `/api/readings` | Add a glucose reading |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |
| GET | `/api/reports?date=YYYY-MM-DD` | Generate glucose reports |
| GET | `/api/health` | Check API status |

Reading history supports pagination using `page` and `limit` query parameters.

## Security

- Passwords are hashed before being stored.
- Authentication uses signed JWTs stored in HTTP-only cookies.
- Protected routes verify the logged-in user's identity.
- Reading and report queries are restricted to the authenticated user.
- SQL queries use parameterized inputs.
- Helmet security headers and authentication rate limiting are enabled.
- Environment files containing secrets are excluded from Git.

## Future Improvements

I would like to improve Sweety further by adding the following features:

1. **Export Reports:** Allow users to download their glucose reports as PDF or Excel files so they can easily share them with healthcare professionals.

2. **AI-Powered Assistant:** Add an assistant that can explain glucose readings, answer general health-related questions, and provide educational information. It should include appropriate medical safety guidance and should not replace professional medical advice.

3. **Voice-Based Reading Entry:** Add voice input so users can speak their glucose readings instead of typing them. This could make the application easier to use, especially for older adults and people who find typing difficult.

4. **Improved Accessibility:** Add more accessibility options, such as larger text, clearer instructions, and easier navigation.

## Project Note

This is a learning project developed to gain practical experience in full-stack web development. It is intended for tracking and understanding glucose readings and is not a medical device or a replacement for professional medical advice.