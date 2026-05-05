# Hostel Management System

A full-stack Hostel Management System built with Node.js, Express.js, PostgreSQL, React, and Vite. The project includes secure authentication, role-based access for admin and students, announcement broadcasting, student payments, complaints, outpass handling, room allocation, and a responsive frontend dashboard.

## Project Structure

- `server.js` - Express server entry point
- `db.js` - PostgreSQL connection setup
- `.env` - backend environment variables
- `controllers/` - backend business logic
- `routes/` - backend API routes
- `middleware/` - JWT auth and role protection
- `scripts/prepareDatabase.js` - database preparation and demo-data normalization
- `hostel_schema.sql` - SQL schema and sample seed data
- `frontend/` - React frontend application
- `frontend/src/` - pages, components, services, styles

## Tech Stack

- Backend: Node.js, Express.js, PostgreSQL
- Frontend: React, Vite, Axios, React Router
- Auth: JWT, bcrypt
- Styling: custom CSS, responsive dashboard UI

## Core Features

- Admin and student login with JWT authentication
- No public signup flow
- Admin-only student account creation
- Password hashing with bcrypt
- Role-protected APIs and dashboards
- Admin announcements broadcast to all students
- Student top-bar announcement notifications with unread state
- Room allocation and room visibility in student dashboard
- Complaint submission and complaint status management
- Outpass request and outside-student tracking
- Student payments with purpose such as `mess`, `hostel_fee`, `laundry`, `maintenance`, and `other`

## Authentication Rules

- Students can log in only if they already exist in the database
- Admin creates student accounts and sets the password
- Student login accepts:
  - email
  - or `student_id`
- Admin login accepts:
  - email

## Demo Data

After running the database preparation script:

- Admin login:
  - `admin@hostel.com`
  - `admin123`
- Existing student login:
  - `alice@example.com / student123`
  - `bob@example.com / student123`
  - `charlie@example.com / student123`
  - `diana@example.com / student123`
  - `eve@example.com / student123`

Students can also log in with `student_id`, for example `1 / student123`.

## Room Demo Setup

The database preparation script normalizes demo room data so the hostel contains room numbers `1` through `12`.

Sample allocations are created for the seeded students:

- Alice -> Room `1`
- Bob -> Room `2`
- Charlie -> Room `3`
- Diana -> Room `4`
- Eve -> Room `5`

Admin can allocate rooms only from the rooms stored in the database.

## Backend Environment

Create or update `.env` in the project root:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostel_db
PORT=3000
JWT_SECRET=change_this_secret
CLIENT_ORIGIN=http://localhost:5173
ADMIN_NAME=Hostel Admin
ADMIN_EMAIL=admin@hostel.com
ADMIN_PASSWORD=admin123
DEFAULT_STUDENT_PASSWORD=student123
```

## Database Setup

1. Create a PostgreSQL database, for example `hostel_db`.
2. Run `hostel_schema.sql` if you are setting up from scratch.
3. Run the preparation script to add auth fields, announcements, payment purpose, room normalization, and demo credentials:

```bash
npm.cmd run prepare-db
```

This script is safe for the current project flow and updates an existing database to the latest structure used by the app.

## Running the Backend

Install backend dependencies:

```bash
npm.cmd install
```

Start the backend:

```bash
npm.cmd start
```

For development with reload:

```bash
npm.cmd run dev
```

Backend runs on:

```text
http://localhost:3000
```

## Running the Frontend

Move into the frontend folder:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm.cmd install
```

Start the frontend:

```bash
npm.cmd run dev
```

Frontend usually runs on:

```text
http://localhost:5173
```

## Important Scripts

- Backend:
  - `npm.cmd start`
  - `npm.cmd run dev`
  - `npm.cmd run prepare-db`
- Frontend:
  - `npm.cmd run dev`
  - `npm.cmd run build`

## API Endpoints

### Auth

- `POST /auth/login` - Login as admin or student
- `PUT /auth/reset-password` - Reset student password after login

### Students

- `GET /students/me` - Logged-in student profile
- `GET /students/me/room` - Logged-in student room details
- `POST /students` - Admin creates student account
- `GET /students` - Admin views all students
- `PUT /students/:id` - Admin updates student
- `DELETE /students/:id` - Admin deletes student

### Rooms

- `POST /rooms` - Admin adds room
- `GET /rooms` - Admin and student view rooms

### Room Allocation

- `POST /allocate-room` - Admin assigns room to student

### Payments

- `POST /payments` - Student or admin creates payment
- `GET /payments` - View payments

### Complaints

- `POST /complaints` - Student creates complaint
- `GET /complaints` - Student views own complaints, admin views all
- `PUT /complaints/:id` - Admin updates complaint status

### Mess Menu

- `GET /menu` - View mess menu

### Outpass

- `POST /outpass/request` - Student requests outpass
- `PUT /outpass/approve/:id` - Admin approves or rejects outpass
- `PUT /outpass/checkout/:id` - Admin records checkout
- `PUT /outpass/checkin/:id` - Admin records checkin
- `GET /outpass/currently-outside` - Admin views students currently outside

### Announcements

- `GET /announcements` - Fetch announcements
- `POST /announcements` - Admin creates broadcast announcement
- `PUT /announcements/:id/read` - Student marks announcement as read

## Frontend Notes

- Login page supports role selection
- Admin dashboard includes:
  - students
  - rooms
  - complaints
  - payments
  - outpass
  - announcements
- Student dashboard includes:
  - profile
  - room details
  - complaints
  - payments with purpose
  - mess menu
  - outpass request
  - sliding announcement bar

## Changing the Background Image

To use your own background image:

1. Create `frontend/src/assets/`
2. Put your image in that folder
3. Update the `body` background in [frontend/src/styles.css](</C:/Users/HP/OneDrive/Desktop/sem 4/DBMS/HMProject/frontend/src/styles.css>)

Example:

```css
url("./assets/hostel-bg.jpg")
```

## Notes

- Use `npm.cmd` in PowerShell if `npm` is blocked by execution policy
- If frontend shows stale data after backend changes, restart backend and hard refresh the browser with `Ctrl + Shift + R`
- `dist/` is generated output and should not be used for source image editing
