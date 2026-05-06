const pool = require('../db');

// Add payment
exports.addPayment = async (req, res) => {
  try {
    const student_id = req.user.role === 'student' ? req.user.student_id : req.body.student_id;
    const { amount, purpose, status } = req.body;
    const paymentStatus = req.user.role === 'student' ? 'paid' : (status || 'pending');

    if (!purpose) {
      return res.status(400).json({ error: 'Payment purpose is required' });
    }

    const result = await pool.query(
      'INSERT INTO payment (student_id, amount, purpose, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, amount, purpose, paymentStatus]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get payments (optionally filter by status)
exports.getPayments = async (req, res) => {
  try {
    const { status } = req.query;
    let result;
    if (req.user.role === 'student') {
      result = status
        ? await pool.query('SELECT * FROM payment WHERE student_id=$1 AND status=$2 ORDER BY payment_date DESC, payment_id DESC', [req.user.student_id, status])
        : await pool.query('SELECT * FROM payment WHERE student_id=$1 ORDER BY payment_date DESC, payment_id DESC', [req.user.student_id]);
    } else if (status) {
      result = await pool.query(
        `SELECT p.*, s.name AS student_name, r.room_number
         FROM payment p
         JOIN student s ON s.student_id = p.student_id
         LEFT JOIN room_allocation ra ON ra.student_id = s.student_id
         LEFT JOIN room r ON r.room_id = ra.room_id
         WHERE p.status=$1
         ORDER BY p.payment_date DESC, p.payment_id DESC`,
        [status]
      );
    } else {
      result = await pool.query(
        `SELECT p.*, s.name AS student_name, r.room_number
         FROM payment p
         JOIN student s ON s.student_id = p.student_id
         LEFT JOIN room_allocation ra ON ra.student_id = s.student_id
         LEFT JOIN room r ON r.room_id = ra.room_id
         ORDER BY p.payment_date DESC, p.payment_id DESC`
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
