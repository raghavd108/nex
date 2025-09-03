import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Use null as the initial state. The useEffect hook will populate it.
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 💡 This is the crucial loading state that prevents the redirect.
  const [isLoading, setIsLoading] = useState(true);

  const login = (tok, uid) => {
    localStorage.setItem("token", tok);
    localStorage.setItem("userId", uid);
    setToken(tok);
    setUserId(uid);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
  };

  // The useEffect now handles all initial state checking.
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");

    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    // 💡 IMPORTANT: Set loading to false *after* the check is complete.
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, userId, login, logout, isAuthenticated, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
