const pool = require('../db');

// Get mess menu
exports.getMenu = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mess_menu');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
