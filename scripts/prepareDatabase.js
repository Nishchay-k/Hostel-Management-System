require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db');

const adminName = process.env.ADMIN_NAME || 'Hostel Admin';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@hostel.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const defaultStudentPassword = process.env.DEFAULT_STUDENT_PASSWORD || 'student123';
const sampleStudents = [
  { student_id: 1, name: 'Kimiko', email: 'kimiko@example.com', phone: '1234567890', gender: 'Female', dob: '2002-01-01', address: '123 Main St' },
  { student_id: 2, name: 'Frenchie', email: 'frenchie@example.com', phone: '2345678901', gender: 'Male', dob: '2001-05-12', address: '456 Oak Ave' },
  { student_id: 3, name: 'Butcher', email: 'butcher@example.com', phone: '3456789012', gender: 'Male', dob: '2003-03-15', address: '789 Pine Rd' },
  { student_id: 4, name: 'Diana', email: 'diana@example.com', phone: '4567890123', gender: 'Female', dob: '2002-07-22', address: '321 Maple St' },
  { student_id: 5, name: 'Becca', email: 'becca@example.com', phone: '5678901234', gender: 'Female', dob: '2001-11-30', address: '654 Cedar Blvd' }
];
const sampleAllocations = [
  { student_id: 1, room_number: '1' },
  { student_id: 2, room_number: '2' },
  { student_id: 3, room_number: '2' },
  { student_id: 4, room_number: '1' },
  { student_id: 5, room_number: '3' }
];

async function prepareDatabase() {
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const studentHash = await bcrypt.hash(defaultStudentPassword, 10);

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

  for (const student of sampleStudents) {
    await pool.query(
      `UPDATE student
       SET name=$1, email=$2, phone=$3, gender=$4, dob=$5, address=$6, role='student', is_active=true
       WHERE student_id=$7`,
      [student.name, student.email, student.phone, student.gender, student.dob, student.address, student.student_id]
    );
  }

  await pool.query(
    `UPDATE room
     SET room_number = CONCAT('legacy-', room_id)
     WHERE room_id BETWEEN 1 AND 12
       AND room_number !~ '^[0-9]+$'`
  );

  await pool.query(
    `UPDATE room
     SET room_number = room_id::text,
         capacity = 2
     WHERE room_id BETWEEN 1 AND 12`
  );

  const roomNumbers = Array.from({ length: 12 }, (_, index) => String(index + 1));
  for (const roomNumber of roomNumbers) {
    await pool.query(
      `INSERT INTO room (room_number, capacity, occupancy)
       VALUES ($1, 2, 0)
       ON CONFLICT (room_number) DO UPDATE
       SET capacity = EXCLUDED.capacity`,
      [roomNumber]
    );
  }

  await pool.query('DELETE FROM room_allocation WHERE student_id = ANY($1::int[])', [sampleStudents.map((student) => student.student_id)]);

  for (const allocation of sampleAllocations) {
    const roomResult = await pool.query('SELECT room_id FROM room WHERE room_number=$1', [allocation.room_number]);
    if (roomResult.rowCount === 0) continue;
    await pool.query(
      `INSERT INTO room_allocation (student_id, room_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id) DO UPDATE SET room_id = EXCLUDED.room_id`,
      [allocation.student_id, roomResult.rows[0].room_id]
    );
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
