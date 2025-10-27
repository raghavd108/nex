import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import API from "../api/axios";
import styles from "../css/AuthPage.module.css";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint = isLogin ? "auth/login" : "auth/register";

    try {
      const res = await API.post(
        endpoint,
        { email, password },
        { withCredentials: true }
      );

      if (!isLogin) {
        // After registration, automatically log in
        const loginRes = await API.post(
          "auth/login",
          { email, password },
          { withCredentials: true }
        );

        login(loginRes.data.token);
        localStorage.setItem("userId", loginRes.data.userId);

        // Redirect to Profile setup page
        navigate("/profile");
      } else {
        login(res.data.token);
        localStorage.setItem("userId", res.data.userId);
        navigate("/home");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Server error. Please try again later."
      );
    }
  };

  return (
    <div className={styles.container}>
      {/* Left photo collage */}
      <div className={styles.photoSection}>
        <div className={styles.photoFrame}>
          <img
            src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1756746180/nex-backgrounds/2_jjomjf.png"
            alt="friends collage 1"
          />
        </div>
        <div className={styles.photoFrame}>
          <img
            src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1756746177/nex-backgrounds/1_xfnint.png"
            alt="friends collage 2"
          />
        </div>
        <div className={styles.photoFrame}>
          <img
            src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1756746179/nex-backgrounds/4_aprxlf.png"
            alt="friends collage 3"
          />
        </div>
      </div>

      {/* Right auth form */}
      <div className={styles.authContainer}>
        <h1 className={styles.brand}>Nex</h1>
        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>

        <div className={styles.divider}>OR</div>

        {/* Fix: valid, navigable link using React Router */}
        <Link to="/forgot-password" className={styles.forgot}>
          Forgotten your password?
        </Link>

        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            onClick={() => setIsLogin(!isLogin)}
            className={styles.toggleLink}
          >
            {isLogin ? " Sign up" : " Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}
