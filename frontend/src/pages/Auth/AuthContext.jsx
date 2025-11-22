import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "ehrSimulatorUser";

const readStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());

  const updateUser = (nextUser) => {
    setUser(nextUser);
    persistUser(nextUser);
  };

  const signIn = async ({ username, password }) => {
    if (typeof window === "undefined" || !window.api?.loginUser) {
      throw new Error("Electron API not available. Please run inside Electron.");
    }
    const response = await window.api.loginUser({ username, password });
    if (!response.success) {
      throw new Error(response.error || "Unable to sign in.");
    }
    const nextUser = response.user;
    updateUser(nextUser);
    return nextUser;
  };

  const register = async ({ username, password, role }) => {
    if (typeof window === "undefined" || !window.api?.registerUser) {
      throw new Error("Electron API not available. Please run inside Electron.");
    }
    const response = await window.api.registerUser({ username, password, role });
    if (!response.success) {
      throw new Error(response.error || "Registration failed.");
    }
    const nextUser = response.user;
    updateUser(nextUser);
    return nextUser;
  };

  const signOut = () => updateUser(null);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user?.id),
      signIn,
      signOut,
      register,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
