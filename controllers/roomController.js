const pool = require('../db');

// Add room
exports.addRoom = async (req, res) => {
  try {
    const { room_number, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO room (room_number, capacity) VALUES ($1, $2) RETURNING *',
      [room_number, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get rooms with occupancy
exports.getRooms = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, COUNT(ra.student_id) AS current_occupancy
       FROM room r
       LEFT JOIN room_allocation ra ON r.room_id = ra.room_id
       GROUP BY r.room_id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
