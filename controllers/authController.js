const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '8h';

exports.login = async (req, res) => {
  try {
    const { identifier, email, student_id, password, role } = req.body;
    const loginId = identifier || email || student_id;

    if (!loginId || !password || !role) {
      return res.status(400).json({ error: 'Identifier, password and role are required' });
    }

    let user;
    if (role === 'admin') {
      const result = await pool.query(
        'SELECT admin_id, name, email, password_hash, role, is_active FROM admin_user WHERE email=$1',
        [loginId]
      );
      user = result.rows[0];
    } else if (role === 'student') {
      const result = await pool.query(
        `SELECT student_id, name, email, password_hash, role, is_active, must_reset_password
         FROM student
         WHERE email=$1 OR student_id::text=$1`,
        [String(loginId)]
      );
      user = result.rows[0];
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash || '');
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenUser = {
      id: user.admin_id || user.student_id,
      admin_id: user.admin_id,
      student_id: user.student_id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, user: { ...tokenUser, must_reset_password: user.must_reset_password || false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can reset this password' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Current password and a new password of at least 6 characters are required' });
    }

    const result = await pool.query('SELECT password_hash FROM student WHERE student_id=$1', [req.user.student_id]);
    const student = result.rows[0];
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const validPassword = await bcrypt.compare(currentPassword, student.password_hash || '');
    if (!validPassword) return res.status(401).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE student SET password_hash=$1, must_reset_password=false WHERE student_id=$2',
      [passwordHash, req.user.student_id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
