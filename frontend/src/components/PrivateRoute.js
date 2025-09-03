import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // 💡 Step 1: Wait for the authentication check to complete.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // 💡 Step 2: Once loading is finished, check if the user is authenticated.
  return isAuthenticated ? children : <Navigate to="/" />;
}
