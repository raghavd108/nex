import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaBell,
  FaGlobe,
  FaEye,
  FaTrash,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import styles from "../css/SettingsPage.module.css";

const BASE_URL = "http://localhost:5001"; // Change to production URL when deployed

export default function SettingsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [language, setLanguage] = useState("English");

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const data = res.data;
        setEmail(data.email || "user@example.com");
        setEmailNotifications(data.emailNotifications ?? true);
        setPushNotifications(data.pushNotifications ?? false);
        setProfileVisibility(data.profileVisibility || "public");
        setLanguage(data.language || "English");
      })
      .catch((err) => {
        console.error("Failed to load settings", err);
        alert("Failed to load settings");
      });
  }, [token]);

  const handleSaveSettings = () => {
    axios
      .put(
        `${BASE_URL}/api/settings`,
        {
          emailNotifications,
          pushNotifications,
          profileVisibility,
          language,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        alert("Settings saved successfully");
      })
      .catch((err) => {
        console.error("Error saving settings", err);
        alert("Failed to save settings");
      });
  };

  const handleChangePassword = async () => {
    const oldPassword = prompt("Enter your old password:");
    const newPassword = prompt("Enter your new password:");

    if (!oldPassword || !newPassword) return alert("Please fill both fields");

    try {
      await axios.put(
        `${BASE_URL}/api/settings/password`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Password changed successfully");
    } catch (err) {
      console.error("Error changing password", err);
      alert("Failed to change password");
    }
  };

  const handleChangeEmail = async () => {
    const newEmail = prompt("Enter your new email:");
    if (!newEmail || !newEmail.includes("@")) {
      return alert("Please enter a valid email address.");
    }

    try {
      const res = await axios.put(
        `${BASE_URL}/api/settings/email`,
        { email: newEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEmail(res.data.email);
      alert("Email updated successfully");
    } catch (err) {
      if (err.response?.status === 409) {
        alert("This email is already in use.");
      } else {
        console.error("Error changing email", err);
        alert("Failed to update email");
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete your account?"
    );
    if (!confirm) return;

    try {
      await axios.delete(`${BASE_URL}/api/settings/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.removeItem("token");
      alert("Account deleted");
      navigate("/signup");
    } catch (err) {
      console.error("Error deleting account", err);
      alert("Failed to delete account");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      <Navbar />
      <div className={styles.settingsContainer}>
        <button
          className={styles.closeBtn}
          onClick={() => navigate("/profile")}
        >
          <FaTimes />
        </button>

        <h1>
          <FaUser /> Settings
        </h1>

        <div className={styles.settingsSection}>
          <h2>
            <FaEnvelope /> Account
          </h2>
          <div className={styles.settingItem}>
            <label>Email</label>
            <input type="email" value={email} readOnly />
            <button onClick={handleChangeEmail}>Change</button>
          </div>
          <div className={styles.settingItem}>
            <label>
              <FaLock /> Change Password
            </label>
            <button onClick={handleChangePassword}>Change</button>
          </div>
        </div>

        <div className={styles.settingsSection}>
          <h2>
            <FaEye /> Privacy & Visibility
          </h2>
          <div className={styles.settingItem}>
            <label>Profile Visibility</label>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value)}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div className={styles.settingsSection}>
          <h2>
            <FaBell /> Notifications
          </h2>
          <div className={`${styles.settingItem} ${styles.toggle}`}>
            <label>Email Notifications</label>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={() => setEmailNotifications(!emailNotifications)}
            />
          </div>
          <div className={`${styles.settingItem} ${styles.toggle}`}>
            <label>Push Notifications</label>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={() => setPushNotifications(!pushNotifications)}
            />
          </div>
        </div>

        <div className={styles.settingsSection}>
          <h2>
            <FaGlobe /> Preferences
          </h2>
          <div className={styles.settingItem}>
            <label>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>
        </div>

        <div className={`${styles.settingsSection} ${styles.dangerZone}`}>
          <h2>
            <FaTrash /> Danger Zone
          </h2>
          <button className={styles.deleteBtn} onClick={handleDeleteAccount}>
            Delete My Account
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>

        <div className={styles.settingsFooter}>
          <button className={styles.saveBtn} onClick={handleSaveSettings}>
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
