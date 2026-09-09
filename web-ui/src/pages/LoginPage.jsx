import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import { validateLoginForm } from "../utils/validators";
import { useAuth } from "../hooks/useAuth";
import InlineError from "../components/common/inLineError";

export default function LoginPage() {
  const [username, setUsername] = useState(""); // email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // Show logout reason if exists
  useEffect(() => {
    const reason = sessionStorage.getItem("auth.logoutReason");
    if (!reason) return;

    sessionStorage.removeItem("auth.logoutReason");

    if (reason === "SESSION_EXPIRED") {
      setError("Your session has expired. Please log in again.");
    } else if (reason === "LOGGED_OUT") {
      setError("You were logged out. Please log in again.");
    } else {
      setError("Please log in again.");
    }
  }, []);

  function validate() {
    const errorMessage = validateLoginForm({ username, password });
    if (errorMessage) {
      setError(errorMessage);
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(username, password);
      navigate("/app");
    } catch (err) {
      if (err?.code === "NETWORK_ERROR") {
        setError("Network error. Please try again later.");
      } else {
        setError(err?.message || "Login failed");
      }
    }
  }

  return (
    <div className="page login-page">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <InlineError message={error} className="ui-error--auth" />

          <button className="auth-button" type="submit">
            Login
          </button>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
