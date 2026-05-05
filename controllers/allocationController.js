const pool = require('../db');

// Assign student to room (with over-capacity prevention)
exports.allocateRoom = async (req, res) => {
  try {
    const { student_id, room_id } = req.body;
    // Check if room is full
    const room = await pool.query('SELECT capacity, occupancy FROM room WHERE room_id=$1', [room_id]);
    if (room.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    if (room.rows[0].occupancy >= room.rows[0].capacity) {
      return res.status(400).json({ error: 'Room is already full' });
    }
    // Allocate room
    await pool.query('BEGIN');
    await pool.query('INSERT INTO room_allocation (student_id, room_id) VALUES ($1, $2)', [student_id, room_id]);
    await pool.query('UPDATE room SET occupancy = occupancy + 1 WHERE room_id = $1', [room_id]);
    await pool.query('COMMIT');
    res.json({ message: 'Room allocated successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
};
