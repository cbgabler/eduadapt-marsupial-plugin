import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import RegisterForm from "./RegisterForm";
import Home from "./Home";
import Scenarios from "./scenarios/Scenarios";
//import Modules from "./Modules.jsx";
import "./App.css";

function Navigation() {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="app-navigation">
      <nav>
        <ul className="nav">
          <li className="nav-item">
            <Link
              to="/home"
              className={`nav-link ${
                location.pathname === "/home" || location.pathname === "/"
                  ? "active"
                  : ""
              }`}
            >
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/Scenarios"
              className={`nav-link ${
                location.pathname === "/Scenarios" ? "active" : ""
              }`}
            >
              Scenarios
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/RegisterForm"
              className={`nav-link ${
                location.pathname === "/RegisterForm" ? "active" : ""
              }`}
            >
              Register
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/scenarios"
              className={`nav-link ${
                location.pathname === "/scenarios" ? "active" : ""
              }`}
            >
              Scenarios
            </Link>
          </li>
          <li className="nav-item dropdown" ref={dropdownRef}>
            <button
              className="dropdown-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
            >
              SignIn
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link
                  to="/SignIn"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  SignIn
                </Link>
                <Link
                  to="/SignUp"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  SignUp
                </Link>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/RegisterForm" element={<RegisterForm />} />
          <Route path="/Scenarios" element={<Scenarios />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
