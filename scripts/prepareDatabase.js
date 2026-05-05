require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db');

const adminName = process.env.ADMIN_NAME || 'Hostel Admin';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@hostel.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const defaultStudentPassword = process.env.DEFAULT_STUDENT_PASSWORD || 'student123';

async function prepareDatabase() {
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const studentHash = await bcrypt.hash(defaultStudentPassword, 10);
  const sampleStudentEmails = [
    'alice@example.com',
    'bob@example.com',
    'charlie@example.com',
    'diana@example.com',
    'eve@example.com'
  ];

  await pool.query('BEGIN');

  await pool.query(`
    ALTER TABLE student
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT true
  `);

  await pool.query(`
    ALTER TABLE payment
      ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) NOT NULL DEFAULT 'general'
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_user (
      admin_id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'admin',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcement (
      announcement_id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      created_by INT REFERENCES admin_user(admin_id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcement_read (
      announcement_id INT NOT NULL REFERENCES announcement(announcement_id) ON DELETE CASCADE,
      student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
      read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (announcement_id, student_id)
    )
  `);

  await pool.query(
    `INSERT INTO admin_user (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET password_hash=EXCLUDED.password_hash, is_active=true`,
    [adminName, adminEmail, adminHash]
  );

  await pool.query(
    `UPDATE student
     SET password_hash=$1, role='student', is_active=true, must_reset_password=true
     WHERE password_hash IS NULL`,
    [studentHash]
  );

  await pool.query(
    `UPDATE room
     SET room_number = CONCAT('legacy-', room_id)
     WHERE room_id BETWEEN 1 AND 12
       AND room_number !~ '^[0-9]+$'`
  );

  await pool.query(
    `UPDATE room
     SET room_number = room_id::text,
         capacity = 1
     WHERE room_id BETWEEN 1 AND 12`
  );

  const roomNumbers = Array.from({ length: 12 }, (_, index) => String(index + 1));
  for (const roomNumber of roomNumbers) {
    await pool.query(
      `INSERT INTO room (room_number, capacity, occupancy)
       VALUES ($1, 1, 0)
       ON CONFLICT (room_number) DO UPDATE
       SET capacity = EXCLUDED.capacity`,
      [roomNumber]
    );
  }

  const demoStudents = await pool.query(
    `SELECT student_id, email
     FROM student
     WHERE email = ANY($1::text[])
     ORDER BY student_id`,
    [sampleStudentEmails]
  );

  const hasAllocations = await pool.query('SELECT COUNT(*)::int AS count FROM room_allocation');
  if (hasAllocations.rows[0].count === 0) {
    for (let index = 0; index < demoStudents.rows.length && index < 12; index += 1) {
      const roomNumber = String(index + 1);
      const roomResult = await pool.query('SELECT room_id FROM room WHERE room_number=$1', [roomNumber]);
      if (roomResult.rowCount === 0) continue;

      await pool.query(
        `INSERT INTO room_allocation (student_id, room_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id) DO NOTHING`,
        [demoStudents.rows[index].student_id, roomResult.rows[0].room_id]
      );
    }
  }

  await pool.query(
    `UPDATE room r
     SET occupancy = COALESCE(alloc.total, 0)
     FROM (
       SELECT room_id, COUNT(*)::int AS total
       FROM room_allocation
       GROUP BY room_id
     ) alloc
     WHERE r.room_id = alloc.room_id`
  );

  await pool.query(
    `UPDATE room
     SET occupancy = 0
     WHERE room_id NOT IN (SELECT DISTINCT room_id FROM room_allocation)`
  );

  await pool.query('COMMIT');

  console.log('Database prepared successfully.');
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Existing student default password: ${defaultStudentPassword}`);
}

prepareDatabase()
  .catch(async (err) => {
    await pool.query('ROLLBACK').catch(() => {});
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
