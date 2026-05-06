const pool = require('../db');

// Request leave
exports.requestOutpass = async (req, res) => {
  try {
    const student_id = req.user.role === 'student' ? req.user.student_id : req.body.student_id;
    const { reason } = req.body;
    const result = await pool.query(
      'INSERT INTO outpass (student_id, reason) VALUES ($1, $2) RETURNING *',
      [student_id, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Approve/Reject leave
exports.approveOutpass = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query(
      'UPDATE outpass SET status=$1 WHERE outpass_id=$2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Outpass not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Record Check-Out time
exports.checkoutOutpass = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE outpass SET check_out_time=NOW() WHERE outpass_id=$1 AND status=$2 RETURNING *',
      [id, 'approved']
    );
    if (result.rowCount === 0) return res.status(400).json({ error: 'Outpass not approved or not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Record Check-In time
exports.checkinOutpass = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE outpass SET check_in_time=NOW() WHERE outpass_id=$1 AND check_out_time IS NOT NULL AND check_in_time IS NULL RETURNING *',
      [id]
    );
    if (result.rowCount === 0) return res.status(400).json({ error: 'Check-out not done or already checked in' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get currently outside students
exports.getCurrentlyOutside = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, s.name, r.room_number FROM outpass o
       JOIN student s ON o.student_id = s.student_id
       LEFT JOIN room_allocation ra ON ra.student_id = s.student_id
       LEFT JOIN room r ON r.room_id = ra.room_id
       WHERE o.check_out_time IS NOT NULL AND o.check_in_time IS NULL`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
