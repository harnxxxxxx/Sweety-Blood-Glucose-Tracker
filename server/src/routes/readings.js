
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';


const router = Router();

router.use(requireAuth);

// GET
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, reading_date, time_slot, glucose_value,
              created_at, updated_at
       FROM glucose_readings
       WHERE user_id = $1
       ORDER BY reading_date DESC`,
      [req.user.id]
    );

    return res.json({
      readings: result.rows
    });

  } catch (error) {
    return next(error);
  }
});



// POST 
router.post('/', async (req, res, next) => {
  try {
    const { date, timeSlot, value } = req.body ?? {};

    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return res.status(400).json({
        error: 'Please enter a glucose value.'
      });
    }

    const glucoseValue = Number(value);

    if (
      !Number.isInteger(glucoseValue) ||
      glucoseValue < 40 ||
      glucoseValue > 600
    ) {
      return res.status(400).json({
        error: 'Value must be between 40 and 600 mg/dl.'
      });
    }

    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        error: 'Please enter a valid date.'
      });
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    const validDate =
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day;

    if (!validDate) {
      return res.status(400).json({
        error: 'Please enter a valid date.'
      });
    }

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    if (date > today) {
      return res.status(400).json({
        error: 'Date cannot be in the future.'
      });
    }


    const allowedSlots = [
      'morning',
      'after_breakfast',
      'after_lunch',
      'after_dinner'
    ];

    if (!allowedSlots.includes(timeSlot)) {
      return res.status(400).json({
        error: 'Please select a valid time slot.'
      });
    }

    
    const userId = req.user.id;

    
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM glucose_readings
       WHERE user_id = $1 AND reading_date = $2`,
      [userId, date]
    );

    const dailyCount = countResult.rows[0].total;

    if (dailyCount >= 4) {
      return res.status(409).json({
        error: 'You can add only 4 readings per day.'
      });
    }

   
    const result = await pool.query(
      `INSERT INTO glucose_readings
        (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date, time_slot, glucose_value,
                 created_at, updated_at`,
      [userId, date, timeSlot, glucoseValue]
    );

    return res.status(201).json({
      message: 'Glucose reading added successfully.',
      reading: result.rows[0]
    });

  } catch (error) {


    if (
      error.code === '23505' &&
      error.constraint === 'unique_user_daily_slot'
    ) {
      const slotNames = {
        morning: 'Morning (fasting)',
        after_breakfast: 'After breakfast',
        after_lunch: 'After lunch',
        after_dinner: 'After dinner'
      };

      const slotName = slotNames[req.body?.timeSlot];

      const article = slotName?.startsWith('After') ? 'an' : 'a';

      return res.status(409).json({
        error: slotName
          ? `You already have ${article} ${slotName} reading for this date.`
          : 'You already have a reading for this date.'
      });
    }

    return next(error);
  }
});


// PUT 
router.put('/:id', async (req, res, next) => {
  try {
    // 1. Get the ID from the URL
  const { id } = req.params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      error: 'Invalid reading ID.'
    });
  }
    const { date, timeSlot, value } = req.body ?? {};

    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return res.status(400).json({
        error: 'Please enter a glucose value.'
      });
    }

    const glucoseValue = Number(value);

    if (
      !Number.isInteger(glucoseValue) ||
      glucoseValue < 40 ||
      glucoseValue > 600
    ) {
      return res.status(400).json({
        error: 'Value must be between 40 and 600 mg/dl.'
      });
    }

    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        error: 'Please enter a valid date.'
      });
    }


    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return res.status(400).json({
        error: 'Please enter a valid date.'
      });
    }

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    if (date > today) {
      return res.status(400).json({
        error: 'Date cannot be in the future.'
      });
    }

    const allowedSlots = [
      'morning',
      'after_breakfast',
      'after_lunch',
      'after_dinner'
    ];

    if (!allowedSlots.includes(timeSlot)) {
      return res.status(400).json({
        error: 'Please select a valid time slot.'
      });
    }

    const result = await pool.query(
      `UPDATE glucose_readings
       SET reading_date = $1,
           time_slot = $2,
           glucose_value = $3,
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, reading_date, time_slot, glucose_value,
                 created_at, updated_at`,
      [date, timeSlot, glucoseValue, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reading not found.'
      });
    }

    return res.json({
      message: 'Glucose reading updated successfully.',
      reading: result.rows[0]
    });

  } catch (error) {
    if (
      error.code === '23505' &&
      error.constraint === 'unique_user_daily_slot'
    ) {
      return res.status(409).json({
        error: 'A reading already exists for this date and time slot.'
      });
    }

    return next(error);
  }
});


// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid reading ID.'
      });
    }

    const result = await pool.query(
      `DELETE FROM glucose_readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reading not found.'
      });
    }

    return res.json({
      message: 'Glucose reading deleted successfully.'
    });

  } catch (error) {
    return next(error);
  }
});


export default router;