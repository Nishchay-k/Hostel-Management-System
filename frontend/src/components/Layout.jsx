import { BellRing, Building2, ClipboardList, CreditCard, Home, LogOut, Megaphone, Menu, Utensils, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const adminItems = [
  ["overview", Home, "Overview"],
  ["students", Users, "Students"],
  ["rooms", Building2, "Rooms"],
  ["complaints", ClipboardList, "Complaints"],
  ["payments", CreditCard, "Payments"],
  ["outpass", BellRing, "Outpass"],
  ["announcements", Megaphone, "Announcements"]
];

const studentItems = [
  ["overview", Home, "Overview"],
  ["complaints", ClipboardList, "Complaints"],
  ["payments", CreditCard, "Payments"],
  ["menu", Utensils, "Mess Menu"],
  ["outpass", BellRing, "Outpass"]
];

export default function Layout({ role, activeTab, setActiveTab, children, notificationData }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = role === "admin" ? adminItems : studentItems;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <Building2 size={28} />
          <div>
            <strong>HostelMS</strong>
            <span>{role === "admin" ? "Admin Console" : "Student Portal"}</span>
          </div>
        </div>
        <nav>
          {items.map(([id, Icon, label]) => (
            <button
              className={activeTab === id ? "active" : ""}
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
              }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <button className="logout-button" type="button" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu size={20} />
          </button>
          <div>
            <span className="eyebrow">{role === "admin" ? "Operations dashboard" : "My hostel dashboard"}</span>
            <h1>{role === "admin" ? "Hostel Management" : `Welcome${user?.name ? `, ${user.name}` : ""}`}</h1>
          </div>
          <div className="topbar-actions">
            <NotificationBell role={role} studentId={user?.student_id} {...notificationData} />
            <div className="avatar">{user?.name?.[0] || user?.email?.[0] || "U"}</div>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
