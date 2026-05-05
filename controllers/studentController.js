const bcrypt = require('bcrypt');
const pool = require('../db');

const publicStudentFields = `
  student_id, name, email, phone, gender, dob, address, role, is_active, must_reset_password
`;

// Add student
exports.addStudent = async (req, res) => {
  try {
    const { name, email, phone, gender, dob, address, password, is_active = true } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Student password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO student (name, email, phone, gender, dob, address, password_hash, role, is_active, must_reset_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'student', $8, true)
       RETURNING ${publicStudentFields}`,
      [name, email, phone, gender, dob, address, passwordHash, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${publicStudentFields} FROM student ORDER BY student_id`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${publicStudentFields} FROM student WHERE student_id=$1`,
      [req.user.student_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyRoom = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, ra.allocation_date
       FROM room_allocation ra
       JOIN room r ON r.room_id = ra.room_id
       WHERE ra.student_id=$1`,
      [req.user.student_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, gender, dob, address, is_active } = req.body;
    const result = await pool.query(
      `UPDATE student
       SET name=$1, email=$2, phone=$3, gender=$4, dob=$5, address=$6, is_active=COALESCE($7, is_active)
       WHERE student_id=$8
       RETURNING ${publicStudentFields}`,
      [name, email, phone, gender, dob, address, is_active, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM student WHERE student_id=$1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
