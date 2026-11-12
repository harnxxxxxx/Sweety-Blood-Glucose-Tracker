
import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function getStats(userId, startDate, endDate) {
  const result = await pool.query(
    `SELECT
       MAX(glucose_value) AS highest,
       MIN(glucose_value) AS lowest,
       ROUND(AVG(glucose_value)::numeric, 1) AS average,
       COUNT(*)::int AS count
     FROM glucose_readings
     WHERE user_id = $1
       AND reading_date BETWEEN $2 AND $3`,
    [userId, startDate, endDate]
  );

  const row = result.rows[0];

  return {
    highest: row.highest === null ? null : Number(row.highest),
    lowest: row.lowest === null ? null : Number(row.lowest),
    average: row.average === null ? null : Number(row.average),
    count: row.count
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;

    // Validate selected date format
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        error: 'Please select a valid report date.'
      });
    }

    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(Date.UTC(year, month - 1, day));

    const validDate =
      selectedDate.getUTCFullYear() === year &&
      selectedDate.getUTCMonth() === month - 1 &&
      selectedDate.getUTCDate() === day;

    if (!validDate) {
      return res.status(400).json({
        error: 'Please select a valid report date.'
      });
    }

    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;

    const previousMonthStart = formatDate(
      new Date(Date.UTC(year, month - 2, 1))
    );

    const previousMonthEnd = formatDate(
      new Date(Date.UTC(year, month - 1, 0))
    );

    const userId = req.user.id;

    const [daily, monthToDate, monthly] = await Promise.all([
      getStats(userId, date, date),
      getStats(userId, monthStart, date),
      getStats(userId, previousMonthStart, previousMonthEnd)
    ]);

    const readingsResult = await pool.query(
      `SELECT
         id,
         reading_date,
         time_slot,
         glucose_value,
         created_at
       FROM glucose_readings
       WHERE user_id = $1
         AND reading_date = $2
       ORDER BY
         CASE time_slot
           WHEN 'morning' THEN 1
           WHEN 'after_breakfast' THEN 2
           WHEN 'after_lunch' THEN 3
           WHEN 'after_dinner' THEN 4
         END`,
      [userId, date]
    );

    return res.status(200).json({
      reports: {
        daily: {
          ...daily,
          readings: readingsResult.rows
        },
        monthToDate,
        monthly
      },
      dateRanges: {
        daily: {
          startDate: date,
          endDate: date
        },
        monthToDate: {
          startDate: monthStart,
          endDate: date
        },
        monthly: {
          startDate: previousMonthStart,
          endDate: previousMonthEnd
        }
      }
    });

  } catch (error) {
    return next(error);
  }
});

export default router;
