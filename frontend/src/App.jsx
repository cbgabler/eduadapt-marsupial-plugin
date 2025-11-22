import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Navigation from "./pages/combined/Navigation.jsx";
import SignInPage from "./pages/Auth/SignInPage.jsx";
import HomePage from "./pages/Home/HomePage.jsx";
import { useAuth } from "./pages/Auth/AuthContext.jsx";
import "./App.css";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return children;
}

function LandingRoute() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/home" : "/sign-in"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
