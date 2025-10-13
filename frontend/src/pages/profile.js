import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCamera,
  FaUserEdit,
  FaUsers,
  FaCog,
  FaSave,
  FaHeart,
  FaComment,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import axios from "axios";
import styles from "../css/ProfilePage.module.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [posts, setPosts] = useState([]);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com";

  const DEFAULT_AVATAR =
    "https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474358/nex-backgrounds/microphone-stool-on-stand-comedy-600nw-1031487514.jpg_mcmw3u.webp";

  const formatAvatarUrl = (avatar) =>
    avatar?.startsWith("http") ? avatar : DEFAULT_AVATAR;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;

        if (username) {
          res = await axios.get(`${API_URL}/api/profile/${username}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          res = await axios.get(`${API_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        const avatarUrl = formatAvatarUrl(res.data.avatar);
        setUser({ ...res.data, avatar: avatarUrl });
        setEditData({ ...res.data, avatar: avatarUrl });
        setPreviewAvatar(avatarUrl);

        const meRes = await axios.get(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsOwnProfile(!username || meRes.data.username === username);

        // ✅ Fetch this user's posts
        const postRes = await axios.get(`${API_URL}/api/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filteredPosts = postRes.data.filter(
          (p) => p.userId.username === (username || meRes.data.username)
        );
        setPosts(filteredPosts);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    if (token) fetchProfile();
    else navigate("/login");
  }, [username, token, navigate]);

  const handleInputChange = (field, value) =>
    setEditData({ ...editData, [field]: value });

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
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile", err);
      if (err.response?.data?.message) setErrorMsg(err.response.data.message);
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
        {/* ---------- Profile Card ---------- */}
        <div className={styles.profileCard}>
          {!isEditing ? (
            <>
              <img
                src={previewAvatar}
                alt="avatar"
                className={styles.profileAvatar}
              />
              <h2>{user.name}</h2>
              <p className={styles.username}>@{user.username}</p>
              <p className={styles.profileBio}>{user.bio}</p>

              {isOwnProfile && (
                <div className={styles.profileOptions}>
                  <label htmlFor="photo-upload" className={styles.optionBox}>
                    <FaCamera className={styles.optionIcon} />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                    />
                    <span>Photo</span>
                  </label>

                  <div
                    className={styles.optionBox}
                    onClick={() => setIsEditing(true)}
                  >
                    <FaUserEdit className={styles.optionIcon} />
                    <span>Edit</span>
                  </div>

                  <div
                    className={styles.optionBox}
                    onClick={() => navigate("/settings")}
                  >
                    <FaCog className={styles.optionIcon} />
                    <span>Settings</span>
                  </div>
                </div>
              )}

              <div className={styles.profileInfo}>
                <p>
                  <strong>Age:</strong> {user.age || "N/A"}
                </p>
                <p>
                  <strong>Location:</strong> {user.location || "Unknown"}
                </p>
                <p>
                  <strong>Interests:</strong>{" "}
                  {user.interests?.join(", ") || "None"}
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
                <label>Interests:</label>
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

              <button type="submit" className={styles.saveBtn}>
                <FaSave /> Save
              </button>
            </form>
          )}
        </div>

        {/* ---------- User Posts Section ---------- */}
        <div className={styles.postsSection}>
          <h3>{isOwnProfile ? "Your Posts" : `${user.name}'s Posts`}</h3>
          {posts.length > 0 ? (
            <div className={styles.postGrid}>
              {posts.map((post) => (
                <div key={post._id} className={styles.postCard}>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="post"
                      className={styles.postImage}
                    />
                  )}
                  <div className={styles.postContent}>
                    <p>{post.content}</p>
                    <div className={styles.postActions}>
                      <FaHeart /> {post.likes?.length || 0}
                      <FaComment style={{ marginLeft: "10px" }} />{" "}
                      {post.comments?.length || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noPosts}>No posts yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
