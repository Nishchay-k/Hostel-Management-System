const pool = require('../db');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

    const result = await pool.query(
      `INSERT INTO announcement (title, message, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, message, req.user.admin_id || req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'student') {
      result = await pool.query(
        `SELECT a.*, CASE WHEN ar.announcement_id IS NULL THEN false ELSE true END AS is_read
         FROM announcement a
         LEFT JOIN announcement_read ar
           ON ar.announcement_id = a.announcement_id AND ar.student_id = $1
         ORDER BY a.created_at DESC`,
        [req.user.student_id]
      );
    } else {
      result = await pool.query('SELECT *, true AS is_read FROM announcement ORDER BY created_at DESC');
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAnnouncementRead = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can mark announcements read' });

    const { id } = req.params;
    await pool.query(
      `INSERT INTO announcement_read (announcement_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, student_id) DO NOTHING`,
      [id, req.user.student_id]
    );

    res.json({ message: 'Announcement marked as read' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
