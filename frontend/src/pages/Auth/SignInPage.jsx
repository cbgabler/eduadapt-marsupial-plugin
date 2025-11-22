import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./SignInPage.css";

const MODES = {
  SIGN_IN: "signIn",
  REGISTER: "register",
};

function SignInPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signIn, register } = useAuth();

  const [mode, setMode] = useState(MODES.SIGN_IN);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/home";

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (mode === MODES.REGISTER) {
        if (password !== confirmPassword) {
          throw new Error("Passwords must match.");
        }
        await register({ username, password, role });
      } else {
        await signIn({ username, password });
      }
      navigate(redirectPath, { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Unable to process request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container sign-in-page">
      <div className="sign-in-card">
        <h1>{mode === MODES.SIGN_IN ? "Sign In" : "Create an Account"}</h1>
        <p className="sign-in-subtitle">
          {mode === MODES.SIGN_IN
            ? "Enter your username and password to continue learning."
            : "Choose a username and password to start practicing scenarios."}
        </p>

        <div className="auth-toggle">
          <button
            type="button"
            className={mode === MODES.SIGN_IN ? "active" : ""}
            onClick={() => handleModeChange(MODES.SIGN_IN)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === MODES.REGISTER ? "active" : ""}
            onClick={() => handleModeChange(MODES.REGISTER)}
          >
            Create Account
          </button>
        </div>

        <form className="sign-in-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g., jane smith"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
            minLength={6}
          />

          {mode === MODES.REGISTER && (
            <>
            <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                required
                minLength={6}
              />
              <label>Role</label>
              <div className="role-toggle">
                <button
                  type="button"
                  className={role === "student" ? "active" : ""}
                  onClick={() => setRole("student")}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={role === "instructor" ? "active" : ""}
                  onClick={() => setRole("instructor")}
                >
                  Instructor
                </button>
              </div>
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === MODES.SIGN_IN
                ? "Signing in..."
                : "Creating account..."
              : mode === MODES.SIGN_IN
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignInPage;
