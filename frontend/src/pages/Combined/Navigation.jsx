import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/Auth/AuthContext.jsx";

function Navigation() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate("/sign-in", { replace: true });
  };

  return (
    <div className="app-navigation">
      <nav>
        <div className="nav-brand">EHR Simulator</div>
        <ul className="nav">
          {isAuthenticated && (
            <li className="nav-item">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Home
              </NavLink>
            </li>
          )}
          <li className="nav-item nav-auth">
            {isAuthenticated ? (
              <button
                type="button"
                className="nav-link nav-button"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            ) : (
              <NavLink
                to="/sign-in"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Sign In
              </NavLink>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Navigation;
