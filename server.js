require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roomRoutes = require('./routes/roomRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const menuRoutes = require('./routes/menuRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const outpassRoutes = require('./routes/outpassRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

// Use routes
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/rooms', roomRoutes);
app.use('/allocate-room', allocationRoutes);
app.use('/menu', menuRoutes);
app.use('/payments', paymentRoutes);
app.use('/complaints', complaintRoutes);
app.use('/outpass', outpassRoutes);
app.use('/announcements', announcementRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hostel Management System API');
});

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);
  console.error(err.stack);

  res.status(500).json({
    error: err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
