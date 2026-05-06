import { BellRing, Building2, CreditCard, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import Layout from "../components/Layout.jsx";
import Modal from "../components/Modal.jsx";
import StatCard from "../components/StatCard.jsx";
import {
  allocateRoom,
  approveOutpass,
  checkinOutpass,
  checkoutOutpass,
  createAnnouncement,
  createPayment,
  createRoom,
  createStudent,
  deleteStudent,
  getComplaints,
  getAnnouncements,
  getCurrentlyOutside,
  getPayments,
  getRooms,
  getStudents,
  updateComplaint
} from "../services/api.js";

const initialStudent = { name: "", email: "", phone: "", gender: "Male", dob: "", address: "", password: "" };
const initialRoom = { room_number: "", capacity: "" };
const initialPayment = { student_id: "", amount: "", purpose: "mess", status: "pending" };
const initialAllocation = { student_id: "", room_id: "" };
const initialAnnouncement = { title: "", message: "" };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [outside, setOutside] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState("");
  const [studentForm, setStudentForm] = useState(initialStudent);
  const [roomForm, setRoomForm] = useState(initialRoom);
  const [paymentForm, setPaymentForm] = useState(initialPayment);
  const [allocationForm, setAllocationForm] = useState(initialAllocation);
  const [announcement, setAnnouncement] = useState(initialAnnouncement);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [studentData, roomData, complaintData, paymentData, outsideData, announcementData] = await Promise.all([
        getStudents(),
        getRooms(),
        getComplaints(),
        getPayments(),
        getCurrentlyOutside(),
        getAnnouncements()
      ]);
      setStudents(studentData);
      setRooms(roomData);
      setComplaints(complaintData);
      setPayments(paymentData);
      setOutside(outsideData);
      setAnnouncements(announcementData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(
    () => ({
      students: students.length,
      rooms: rooms.length,
      complaints: complaints.filter((item) => item.status === "pending").length,
      outside: outside.length
    }),
    [students, rooms, complaints, outside]
  );

  const handleSubmit = async (event, action, reset, close = true) => {
    event.preventDefault();
    setError("");
    try {
      await action();
      reset?.();
      if (close) setModal("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Action failed.");
    }
  };

  const handleComplaintStatus = async (complaintId, status) => {
    setError("");
    try {
      await updateComplaint(complaintId, { status });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not update complaint status.");
    }
  };

  return (
    <Layout role="admin" activeTab={activeTab} setActiveTab={setActiveTab} notificationData={{ complaints, payments, outside, announcements }}>
      <section className="page-section fade-in">
        <div className="section-toolbar">
          <div>
            <span className="eyebrow">Live hostel control center</span>
            <h2>{activeTab[0].toUpperCase() + activeTab.slice(1)}</h2>
          </div>
          {activeTab === "announcements" ? (
            <button className="primary-button compact-button" type="button" onClick={() => setModal("announcement")}>
              Create Announcement
            </button>
          ) : null}
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {loading ? <p className="muted">Loading dashboard data...</p> : null}

        {activeTab === "overview" ? (
          <>
            <div className="stats-grid">
              <StatCard label="Students" value={stats.students} icon={Users} />
              <StatCard label="Rooms" value={stats.rooms} icon={Building2} tone="green" />
              <StatCard label="Pending complaints" value={stats.complaints} icon={BellRing} tone="amber" />
              <StatCard label="Currently outside" value={stats.outside} icon={CreditCard} tone="rose" />
            </div>
            <div className="grid-two">
              <Panel title="Recent Complaints">
                <DataTable
                  rows={complaints.slice(0, 5)}
                  columns={[
                    { key: "complaint_id", label: "ID" },
                    { key: "student_name", label: "Student", render: (row) => row.student_name || `#${row.student_id}` },
                    { key: "room_number", label: "Room" },
                    { key: "description", label: "Description" },
                    { key: "status", label: "Status", render: (row) => <Status value={row.status} /> }
                  ]}
                />
              </Panel>
              <Panel title="Rooms">
                <DataTable
                  rows={rooms.slice(0, 5)}
                  columns={[
                    { key: "room_number", label: "Room" },
                    { key: "capacity", label: "Capacity" },
                    { key: "current_occupancy", label: "Occupied" }
                  ]}
                />
              </Panel>
            </div>
          </>
        ) : null}

        {activeTab === "students" ? (
          <Panel
            title="Students"
            action={
              <button className="secondary-button" type="button" onClick={() => setModal("student")}>
                <Plus size={16} /> Add Student
              </button>
            }
          >
            <DataTable
              rows={students}
              columns={[
                { key: "student_id", label: "ID" },
                { key: "name", label: "Name" },
                { key: "room_number", label: "Room" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                { key: "gender", label: "Gender" },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <button className="text-button danger" type="button" onClick={() => handleSubmit({ preventDefault() {} }, () => deleteStudent(row.student_id))}>
                      Delete
                    </button>
                  )
                }
              ]}
            />
          </Panel>
        ) : null}

        {activeTab === "rooms" ? (
          <Panel
            title="Rooms & Allocation"
            action={
              <div className="button-row">
                <button className="secondary-button" type="button" onClick={() => setModal("room")}>
                  <Plus size={16} /> Add Room
                </button>
                <button className="secondary-button" type="button" onClick={() => setModal("allocation")}>
                  Allocate Room
                </button>
              </div>
            }
          >
            <DataTable
              rows={rooms.filter((room) => Number(room.current_occupancy) > 0)}
              columns={[
                { key: "room_number", label: "Room" },
                { key: "capacity", label: "Capacity" },
                { key: "current_occupancy", label: "Occupied" }
              ]}
              emptyText="No occupied rooms yet."
            />
          </Panel>
        ) : null}

        {activeTab === "complaints" ? (
          <Panel title="Complaints">
            <DataTable
              rows={complaints}
              columns={[
                { key: "complaint_id", label: "ID" },
                { key: "student_name", label: "Student", render: (row) => row.student_name || `#${row.student_id}` },
                { key: "room_number", label: "Room" },
                { key: "description", label: "Description" },
                { key: "status", label: "Status", render: (row) => <Status value={row.status} /> },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    row.status === "pending" ? (
                      <div className="button-row">
                        <button className="text-button" type="button" onClick={() => handleComplaintStatus(row.complaint_id, "approved")}>
                          Approve
                        </button>
                        <button className="text-button danger" type="button" onClick={() => handleComplaintStatus(row.complaint_id, "rejected")}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="muted">No action</span>
                    )
                  )
                }
              ]}
            />
          </Panel>
        ) : null}

        {activeTab === "payments" ? (
          <Panel
            title="Payments"
            action={
              <button className="secondary-button" type="button" onClick={() => setModal("payment")}>
                <Plus size={16} /> Add Payment
              </button>
            }
          >
            <DataTable
              rows={payments}
              columns={[
                { key: "payment_id", label: "ID" },
                { key: "student_name", label: "Student", render: (row) => row.student_name || `#${row.student_id}` },
                { key: "room_number", label: "Room" },
                { key: "purpose", label: "Purpose", render: (row) => formatPurpose(row.purpose) },
                { key: "amount", label: "Amount", render: (row) => `Rs. ${row.amount}` },
                { key: "status", label: "Status", render: (row) => <Status value={row.status} /> }
              ]}
            />
          </Panel>
        ) : null}

        {activeTab === "outpass" ? (
          <Panel title="Currently Outside">
            <DataTable
              rows={outside}
              emptyText="No students are currently outside. Add a GET /outpass endpoint to manage pending approval queues."
              columns={[
                { key: "outpass_id", label: "ID" },
                { key: "name", label: "Student" },
                { key: "room_number", label: "Room" },
                { key: "reason", label: "Reason" },
                { key: "status", label: "Status", render: (row) => <Status value={row.status} /> },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="button-row">
                      <button className="text-button" type="button" onClick={() => approveOutpass(row.outpass_id, { status: "approved" }).then(loadData)}>
                        Approve
                      </button>
                      <button className="text-button" type="button" onClick={() => checkoutOutpass(row.outpass_id).then(loadData)}>
                        Checkout
                      </button>
                      <button className="text-button" type="button" onClick={() => checkinOutpass(row.outpass_id).then(loadData)}>
                        Checkin
                      </button>
                    </div>
                  )
                }
              ]}
            />
          </Panel>
        ) : null}

        {activeTab === "announcements" ? (
          <div className="grid-two">
            <Panel title="Create Broadcast">
              <form className="stack-form" onSubmit={(event) => handleSubmit(event, () => createAnnouncement(announcement), () => setAnnouncement(initialAnnouncement), false)}>
                <Input label="Title" value={announcement.title} onChange={(value) => setAnnouncement((current) => ({ ...current, title: value }))} required />
                <Textarea label="Message" value={announcement.message} onChange={(value) => setAnnouncement((current) => ({ ...current, message: value }))} required />
                <button className="primary-button" type="submit">Broadcast to students</button>
              </form>
            </Panel>
            <Panel title="Previous Announcements">
              <div className="announcement-list">
                {announcements.length ? announcements.map((item) => (
                  <article key={item.announcement_id}>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </article>
                )) : <p className="muted">No announcements created yet.</p>}
              </div>
            </Panel>
          </div>
        ) : null}
      </section>

      <Modal title="Send Announcement" open={modal === "announcement"} onClose={() => setModal("")}>
        <form className="modal-form" onSubmit={(event) => handleSubmit(event, () => createAnnouncement(announcement), () => setAnnouncement(initialAnnouncement))}>
          <Input label="Title" value={announcement.title} onChange={(value) => setAnnouncement((current) => ({ ...current, title: value }))} required />
          <Textarea label="Message" value={announcement.message} onChange={(value) => setAnnouncement((current) => ({ ...current, message: value }))} required />
          <button className="primary-button" type="submit">Send to all students</button>
        </form>
      </Modal>

      <Modal title="Add Student" open={modal === "student"} onClose={() => setModal("")}>
        <form className="modal-form" onSubmit={(event) => handleSubmit(event, () => createStudent(studentForm), () => setStudentForm(initialStudent))}>
          {["name", "email", "phone", "dob", "address", "password"].map((field) => (
            <Input key={field} type={field === "password" ? "password" : field === "dob" ? "date" : "text"} label={field.replace("_", " ")} value={studentForm[field]} onChange={(value) => setStudentForm((current) => ({ ...current, [field]: value }))} required={field !== "address"} />
          ))}
          <Select label="Gender" value={studentForm.gender} onChange={(value) => setStudentForm((current) => ({ ...current, gender: value }))} options={["Male", "Female", "Other"]} />
          <button className="primary-button" type="submit">Save student</button>
        </form>
      </Modal>

      <Modal title="Add Room" open={modal === "room"} onClose={() => setModal("")}>
        <form className="modal-form" onSubmit={(event) => handleSubmit(event, () => createRoom({ ...roomForm, capacity: Number(roomForm.capacity) }), () => setRoomForm(initialRoom))}>
          <Input label="Room number" value={roomForm.room_number} onChange={(value) => setRoomForm((current) => ({ ...current, room_number: value }))} required />
          <Input label="Capacity" type="number" value={roomForm.capacity} onChange={(value) => setRoomForm((current) => ({ ...current, capacity: value }))} required />
          <button className="primary-button" type="submit">Save room</button>
        </form>
      </Modal>

      <Modal title="Allocate Room" open={modal === "allocation"} onClose={() => setModal("")}>
        <form className="modal-form" onSubmit={(event) => handleSubmit(event, () => allocateRoom({ student_id: Number(allocationForm.student_id), room_id: Number(allocationForm.room_id) }), () => setAllocationForm(initialAllocation))}>
          <Select label="Student" value={allocationForm.student_id} onChange={(value) => setAllocationForm((current) => ({ ...current, student_id: value }))} options={students.map((item) => ({ label: `${item.name} (#${item.student_id})`, value: item.student_id }))} />
          <Select label="Room" value={allocationForm.room_id} onChange={(value) => setAllocationForm((current) => ({ ...current, room_id: value }))} options={rooms.map((item) => ({ label: `${item.room_number} (${item.current_occupancy}/${item.capacity})`, value: item.room_id }))} />
          <button className="primary-button" type="submit">Allocate</button>
        </form>
      </Modal>

      <Modal title="Add Payment" open={modal === "payment"} onClose={() => setModal("")}>
        <form className="modal-form" onSubmit={(event) => handleSubmit(event, () => createPayment({ ...paymentForm, student_id: Number(paymentForm.student_id), amount: Number(paymentForm.amount) }), () => setPaymentForm(initialPayment))}>
          <Select label="Student" value={paymentForm.student_id} onChange={(value) => setPaymentForm((current) => ({ ...current, student_id: value }))} options={students.map((item) => ({ label: `${item.name} (#${item.student_id})`, value: item.student_id }))} />
          <Select label="Purpose" value={paymentForm.purpose} onChange={(value) => setPaymentForm((current) => ({ ...current, purpose: value }))} options={["mess", "hostel_fee", "laundry", "maintenance", "other"]} />
          <Input label="Amount" type="number" value={paymentForm.amount} onChange={(value) => setPaymentForm((current) => ({ ...current, amount: value }))} required />
          <Select label="Status" value={paymentForm.status} onChange={(value) => setPaymentForm((current) => ({ ...current, status: value }))} options={["pending", "paid"]} />
          <button className="primary-button" type="submit">Save payment</button>
        </form>
      </Modal>
    </Layout>
  );
}

function Panel({ title, action, children }) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </article>
  );
}

function Status({ value }) {
  return <span className={`status-pill ${value || "pending"}`}>{value || "pending"}</span>;
}

function Input({ label, type = "text", value, onChange, required }) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function Textarea({ label, value, onChange, required }) {
  return (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} required={required} rows={4} />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select</option>
        {options.map((option) => {
          const normalized = typeof option === "string" ? { label: option, value: option } : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function formatPurpose(value) {
  return (value || "general").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
