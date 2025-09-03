import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaUserEdit, FaUsers, FaCog, FaSave } from "react-icons/fa";
import Navbar from "../components/Navbar";
import axios from "axios";
import styles from "../css/ProfilePage.module.css";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/profile/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const avatarUrl = res.data.avatar?.startsWith("http")
          ? res.data.avatar
          : `http://localhost:5001${res.data.avatar}`;

        setUser({ ...res.data, avatar: avatarUrl });
        setEditData({ ...res.data, avatar: avatarUrl });
        setPreviewAvatar(avatarUrl);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleInputChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...editData,
        interests:
          typeof editData.interests === "string"
            ? editData.interests.split(",").map((i) => i.trim())
            : editData.interests,
      };

      const res = await axios.put(
        "http://localhost:5001/api/profile/me",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const avatarUrl = res.data.avatar?.startsWith("http")
        ? res.data.avatar
        : `http://localhost:5001${res.data.avatar}`;

      setUser({ ...res.data, avatar: avatarUrl });
      setEditData({ ...res.data, avatar: avatarUrl });
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile", err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/profile/me/photo",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const avatarUrl = `http://localhost:5001${res.data.avatar}`;
      setUser((prev) => ({ ...prev, avatar: avatarUrl }));
      setEditData((prev) => ({ ...prev, avatar: avatarUrl }));
      setPreviewAvatar(avatarUrl);
    } catch (err) {
      console.error("Error uploading photo", err);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className={styles.profileContainer}>
        <div className={styles.profileCard}>
          {!isEditing ? (
            <>
              <img
                src={previewAvatar || "/images/default-avatar.png"}
                alt="avatar"
                className={styles.profileAvatar}
              />
              <h2>{user.name}</h2>
              <p className={styles.profileBio}>{user.bio}</p>

              <div className={styles.profileOptions}>
                <div className={styles.optionBox}>
                  <label htmlFor="photo-upload" style={{ cursor: "pointer" }}>
                    <FaCamera className={styles.optionIcon} />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <span>Photo</span>
                </div>

                <div
                  className={styles.optionBox}
                  onClick={() => setIsEditing(true)}
                >
                  <FaUserEdit className={styles.optionIcon} />
                  <span>Edit</span>
                </div>

                <div
                  className={styles.optionBox}
                  onClick={() => alert("Open Network Panel")}
                >
                  <FaUsers className={styles.optionIcon} />
                  <span>Networks</span>
                </div>

                <div
                  className={styles.optionBox}
                  onClick={() => navigate("/settings")}
                >
                  <FaCog className={styles.optionIcon} />
                  <span>Settings</span>
                </div>
              </div>

              <div className={styles.profileInfo}>
                <p>
                  <strong>Age:</strong> {user.age}
                </p>
                <p>
                  <strong>Location:</strong> {user.location}
                </p>
                <p>
                  <strong>Interests:</strong> {user.interests?.join(", ")}
                </p>
              </div>
            </>
          ) : (
            <form
              className={styles.editForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className={styles.formGroup}>
                <label>Name:</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Bio:</label>
                <textarea
                  rows="3"
                  value={editData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Age:</label>
                <input
                  type="number"
                  value={editData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Location:</label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Interests (comma separated):</label>
                <input
                  type="text"
                  value={
                    typeof editData.interests === "string"
                      ? editData.interests
                      : editData.interests.join(", ")
                  }
                  onChange={(e) =>
                    handleInputChange("interests", e.target.value)
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <button type="submit" className={styles.saveBtn}>
                  <FaSave /> Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
