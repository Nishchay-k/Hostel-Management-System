-- Hostel Management System SQL Schema

-- Student Table
CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    address TEXT,
    password_hash TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_reset_password BOOLEAN NOT NULL DEFAULT true
);

-- Admin Table
CREATE TABLE admin_user (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Table
CREATE TABLE room (
    room_id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    occupancy INT DEFAULT 0
);

-- Room Allocation Table
CREATE TABLE room_allocation (
    allocation_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    room_id INT NOT NULL REFERENCES room(room_id) ON DELETE CASCADE,
    allocation_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(student_id),
    UNIQUE(room_id, student_id)
);

-- Mess Menu Table
CREATE TABLE mess_menu (
    menu_id SERIAL PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL
);

-- Payment Table
CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'general',
    status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'pending')),
    payment_date DATE DEFAULT CURRENT_DATE
);

-- Complaint Table
CREATE TABLE complaint (
    complaint_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outpass Table
CREATE TABLE outpass (
    outpass_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_time TIMESTAMP
);

-- Announcements Table
CREATE TABLE announcement (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    created_by INT REFERENCES admin_user(admin_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student announcement read status
CREATE TABLE announcement_read (
    announcement_id INT NOT NULL REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, student_id)
);

-- Trigger: Prevent Room Over-Allocation
CREATE OR REPLACE FUNCTION prevent_over_allocation() RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT occupancy FROM room WHERE room_id = NEW.room_id) >= (SELECT capacity FROM room WHERE room_id = NEW.room_id) THEN
        RAISE EXCEPTION 'Room is already full!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_over_allocation
BEFORE INSERT ON room_allocation
FOR EACH ROW EXECUTE FUNCTION prevent_over_allocation();

-- Trigger: Prevent Checkout Without Approval
CREATE OR REPLACE FUNCTION prevent_checkout_without_approval() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.status != 'approved' THEN
        RAISE EXCEPTION 'Cannot checkout without approval!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_checkout_without_approval
BEFORE UPDATE ON outpass
FOR EACH ROW EXECUTE FUNCTION prevent_checkout_without_approval();

-- Sample Data
INSERT INTO student (name, email, phone, gender, dob, address) VALUES
('Kimiko', 'kimiko@example.com', '1234567890', 'Female', '2002-01-01', '123 Main St'),
('Frenchie', 'frenchie@example.com', '2345678901', 'Male', '2001-05-12', '456 Oak Ave'),
('Butcher', 'butcher@example.com', '3456789012', 'Male', '2003-03-15', '789 Pine Rd'),
('Diana', 'diana@example.com', '4567890123', 'Female', '2002-07-22', '321 Maple St'),
('Becca', 'becca@example.com', '5678901234', 'Female', '2001-11-30', '654 Cedar Blvd');

INSERT INTO room (room_number, capacity) VALUES
('1', 2),
('2', 2),
('3', 2),
('4', 2),
('5', 2),
('6', 2),
('7', 2),
('8', 2),
('9', 2),
('10', 2),
('11', 2),
('12', 2);

INSERT INTO room_allocation (student_id, room_id) VALUES
(1, 1),
(2, 2),
(3, 2),
(4, 1),
(5, 3);

UPDATE room
SET occupancy = counts.total
FROM (
    SELECT room_id, COUNT(*)::int AS total
    FROM room_allocation
    GROUP BY room_id
) counts
WHERE room.room_id = counts.room_id;

INSERT INTO mess_menu (day, meal_type, description) VALUES
('Monday', 'Lunch', 'Rice, Dal, Paneer'),
('Tuesday', 'Dinner', 'Roti, Sabzi, Curd'),
('Wednesday', 'Lunch', 'Pulao, Chole, Salad');

INSERT INTO payment (student_id, amount, purpose, status) VALUES
(1, 5000, 'hostel_fee', 'paid'),
(2, 5000, 'mess', 'pending'),
(3, 5000, 'hostel_fee', 'paid');

INSERT INTO complaint (student_id, description) VALUES
(1, 'Fan not working'),
(2, 'Water leakage in bathroom');

INSERT INTO outpass (student_id, reason, status) VALUES
(1, 'Family function', 'pending'),
(2, 'Medical emergency', 'approved');

-- Useful JOIN Queries
-- 1. List all students with their room numbers
SELECT s.name, r.room_number FROM student s
JOIN room_allocation ra ON s.student_id = ra.student_id
JOIN room r ON ra.room_id = r.room_id;

-- 2. List all payments with student names
SELECT s.name, p.amount, p.purpose, p.status FROM payment p
JOIN student s ON p.student_id = s.student_id;

-- 3. List all complaints with student info
SELECT c.complaint_id, s.name, c.description, c.status FROM complaint c
JOIN student s ON c.student_id = s.student_id;

-- 4. List all outpass requests with student names and status
SELECT o.outpass_id, s.name, o.status, o.check_out_time, o.check_in_time FROM outpass o
JOIN student s ON o.student_id = s.student_id;

-- 5. List rooms with current occupancy
SELECT r.room_number, r.capacity, COUNT(ra.student_id) AS current_occupancy FROM room r
LEFT JOIN room_allocation ra ON r.room_id = ra.room_id
GROUP BY r.room_id;
