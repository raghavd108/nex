// App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthPage from "./components/AuthPage";
import Explore from "./pages/Explore";
import Profile from "./pages/profile"; // ✅ make sure file name matches case
import Match from "./pages/match";
import Home from "./pages/home";
import Video from "./pages/video";
import SettingsPage from "./pages/SettingsPage";
import { AuthProvider } from "./components/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import ThemedRoom from "./pages/ThemedRoom";
import CreateStartup from "./pages/CreateStartup";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<AuthPage />} />

          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <PrivateRoute>
                <Explore />
              </PrivateRoute>
            }
          />

          {/* ✅ Profile routes */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="/match"
            element={
              <PrivateRoute>
                <Match />
              </PrivateRoute>
            }
          />
          <Route
            path="/video"
            element={
              <PrivateRoute>
                <Video />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <PrivateRoute>
                <ThemedRoom />
              </PrivateRoute>
            }
          />
          <Route
            path="/CreateStartup"
            element={
              <PrivateRoute>
                <CreateStartup />
              </PrivateRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
