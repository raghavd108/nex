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
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  const API_URL = "https://nex-pjq3.onrender.com";
  const DEFAULT_AVATAR =
    "https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474358/nex-backgrounds/microphone-stool-on-stand-comedy-600nw-1031487514.jpg_mcmw3u.webp";

  const formatAvatarUrl = (avatar) => {
    if (!avatar) return DEFAULT_AVATAR;
    return avatar.startsWith("http") ? avatar : avatar;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const avatarUrl = formatAvatarUrl(res.data.avatar);

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
      setErrorMsg("");
      const payload = {
        ...editData,
        interests:
          typeof editData.interests === "string"
            ? editData.interests.split(",").map((i) => i.trim())
            : editData.interests,
      };

      const res = await axios.put(`${API_URL}/api/profile/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const avatarUrl = formatAvatarUrl(res.data.avatar);

      setUser({ ...res.data, avatar: avatarUrl });
      setEditData({ ...res.data, avatar: avatarUrl });
      setPreviewAvatar(avatarUrl);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile", err);
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await axios.post(
        `${API_URL}/api/profile/me/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const avatarUrl = formatAvatarUrl(res.data.avatar);
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
                src={previewAvatar || formatAvatarUrl(user.avatar)}
                alt="avatar"
                className={styles.profileAvatar}
              />
              <h2>{user.name}</h2>
              <p className={styles.username}>@{user.username}</p>
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
              {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

              <div className={styles.editInput}>
                <label>Name:</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className={styles.editInput}>
                <label>Username:</label>
                <input
                  type="text"
                  value={editData.username || ""}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder="Choose a unique username"
                />
              </div>

              <div className={styles.editInput}>
                <label>Bio:</label>
                <textarea
                  rows="3"
                  value={editData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                />
              </div>

              <div className={styles.editInput}>
                <label>Age:</label>
                <input
                  type="number"
                  value={editData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>

              <div className={styles.editInput}>
                <label>Location:</label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                />
              </div>

              <div className={styles.editInput}>
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
