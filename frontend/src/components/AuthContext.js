import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);

  // Prevent UI flicker on refresh
  const [isLoading, setIsLoading] = useState(true);

  // ----------------------------------------
  // LOGIN FUNCTION
  // ----------------------------------------
  const login = (tokenValue, uid, profileCompleted) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("userId", uid);
    localStorage.setItem("isProfileCompleted", profileCompleted);

    setToken(tokenValue);
    setUserId(uid);
    setIsProfileCompleted(profileCompleted);
    setIsAuthenticated(true);
  };

  // ----------------------------------------
  // LOGOUT FUNCTION
  // ----------------------------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("isProfileCompleted");

    setToken(null);
    setUserId(null);
    setIsProfileCompleted(false);
    setIsAuthenticated(false);
  };

  // ----------------------------------------
  // LOAD USER DATA ON REFRESH
  // ----------------------------------------
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    const storedProfileStatus =
      localStorage.getItem("isProfileCompleted") === "true";

    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
      setIsProfileCompleted(storedProfileStatus);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        login,
        logout,
        isAuthenticated,
        isProfileCompleted,
        setIsProfileCompleted, // ⭐ useful when profile is completed later
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
