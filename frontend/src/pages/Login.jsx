import { Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "", role: "student" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(form);
      navigate(user.role === "admin" ? "/admin" : "/student", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card fade-in">
        <div className="login-brand">
          <Building2 size={34} />
          <div>
            <span>Hostel Management System</span>
            <h1>Sign in to continue</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Role
            <div className="segmented-control">
              <button className={form.role === "student" ? "selected" : ""} type="button" onClick={() => updateField("role", "student")}>
                Student
              </button>
              <button className={form.role === "admin" ? "selected" : ""} type="button" onClick={() => updateField("role", "admin")}>
                Admin
              </button>
            </div>
          </label>

          <label>
            {form.role === "admin" ? "Email" : "Email or Student ID"}
            <div className="input-icon">
              <Mail size={18} />
              <input
                value={form.identifier}
                onChange={(event) => updateField("identifier", event.target.value)}
                type="text"
                placeholder={form.role === "admin" ? "admin@hostel.com" : "email@example.com or 101"}
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-icon">
              <Lock size={18} />
              <input
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
