const pool = require('../db');

// Register complaint
exports.addComplaint = async (req, res) => {
  try {
    const student_id = req.user.role === 'student' ? req.user.student_id : req.body.student_id;
    const { description } = req.body;
    const result = await pool.query(
      'INSERT INTO complaint (student_id, description) VALUES ($1, $2) RETURNING *',
      [student_id, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// View complaints
exports.getComplaints = async (req, res) => {
  try {
    const result = req.user.role === 'student'
      ? await pool.query('SELECT * FROM complaint WHERE student_id=$1 ORDER BY created_at DESC', [req.user.student_id])
      : await pool.query(
        `SELECT c.*, s.name AS student_name, r.room_number
         FROM complaint c
         JOIN student s ON s.student_id = c.student_id
         LEFT JOIN room_allocation ra ON ra.student_id = s.student_id
         LEFT JOIN room r ON r.room_id = ra.room_id
         ORDER BY c.created_at DESC`
      );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update complaint status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid complaint status' });
    }
    const result = await pool.query(
      'UPDATE complaint SET status=$1 WHERE complaint_id=$2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Complaint not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
