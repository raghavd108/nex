import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FaCamera,
  FaUserEdit,
  FaCog,
  FaSave,
  FaHeart,
  FaComment,
  FaTrash,
  FaShare,
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

        // Fetch posts
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

  const handleMultiSelect = (field, value) => {
    setEditData((prev) => {
      const current = prev[field] || [];
      if (current.includes(value))
        return { ...prev, [field]: current.filter((v) => v !== value) };
      else return { ...prev, [field]: [...current, value] };
    });
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

  const roleOptions = [
    "Founder",
    "Co-founder",
    "Investor",
    "Mentor",
    "Developer",
    "Designer",
    "Marketer",
    "Advisor",
    "Student",
    "Other",
  ];
  const lookingForOptions = ["Co-founder", "Investor", "Mentor"];
  // ✅ Like post (works for both users and startups)
  const handleLike = async (postId, isStartupPost = false) => {
    try {
      const endpoint = `${API_URL}/api/${
        isStartupPost ? "startupPosts" : "posts"
      }/${postId}/like`;
      const res = await axios.put(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // res.data.likes is an array of profile ids — update likes on that post
      const updatedLikes = res.data.likes || [];

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: updatedLikes } : p))
      );
    } catch (err) {
      console.error("Error liking post:", err.response?.data || err.message);
    }
  };

  // ✅ Comment (works for both)
  const handleComment = async (postId, isStartupPost = false) => {
    const text = prompt("Write a comment:");
    if (!text.trim()) return;

    try {
      const endpoint = `${API_URL}/${
        isStartupPost ? "startupPosts" : "posts"
      }/${postId}/comment`;
      const res = await axios.post(
        endpoint,
        { text },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Replace post with updated data from backend
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
    } catch (err) {
      console.error("Error adding comment:", err.response?.data || err.message);
    }
  };
  // ✅ Delete post (works for both)
  const handleDeletePost = async (postId, isStartupPost = false) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_URL}/api/${isStartupPost ? "startupPosts" : "posts"}/${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.profileContainer}>
        {/* PROFILE HEADER */}
        <div className={styles.profileCard}>
          {!isEditing ? (
            <>
              <div className={styles.profileHeader}>
                <img
                  src={previewAvatar}
                  alt="avatar"
                  className={styles.profileAvatar}
                />
                <div className={styles.profileInfo}>
                  <h2>{user.name}</h2>
                  <p className={styles.username}>@{user.username}</p>
                  <p className={styles.profileBio}>{user.bio}</p>

                  {isOwnProfile && (
                    <div className={styles.profileOptions}>
                      <label
                        htmlFor="photo-upload"
                        className={styles.optionBox}
                      >
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
                </div>
              </div>

              {/* PROFILE DETAILS */}
              <div className={styles.profileDetails}>
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
                <p>
                  <strong>Roles:</strong> {user.roles?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Skills:</strong> {user.skills?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Industries:</strong>{" "}
                  {user.industries?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Looking For:</strong>{" "}
                  {user.lookingFor?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Open to Collaborate:</strong>{" "}
                  {user.isOpenToCollaborate ? "Yes" : "No"}
                </p>

                {/* ✅ STARTUP AFFILIATIONS (Fixed for null startupId) */}
                {user.startupAffiliations && user.startupAffiliations.length > 0
                  ? (() => {
                      const validStartups = user.startupAffiliations.filter(
                        (s) => s.startupId && s.startupId._id
                      );

                      return validStartups.length > 0 ? (
                        <div className={styles.startupAffiliations}>
                          <strong>Startups:</strong>
                          <ul>
                            {validStartups.map((s) => (
                              <li key={s.startupId._id}>
                                <Link to={`/startup/${s.startupId._id}`}>
                                  {s.startupId.name} ({s.role}){" "}
                                  {s.isFounder && "⭐"}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        isOwnProfile && (
                          <div className={styles.createStartupPrompt}>
                            <p>You haven’t created a startup yet!</p>
                            <button
                              onClick={() => navigate("/CreateStartup")}
                              className={styles.createStartupBtn}
                            >
                              Create Your Startup
                            </button>
                          </div>
                        )
                      );
                    })()
                  : isOwnProfile && (
                      <div className={styles.createStartupPrompt}>
                        <p>You haven’t created a startup yet!</p>
                        <button
                          onClick={() => navigate("/CreateStartup")}
                          className={styles.createStartupBtn}
                        >
                          Create Your Startup
                        </button>
                      </div>
                    )}
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

              {/* EDIT FORM */}
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
                <label>Interests (comma separated):</label>
                <input
                  type="text"
                  value={editData.interests?.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "interests",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                />
              </div>

              <div className={styles.editcheckbox}>
                <label>Roles:</label>
                {roleOptions.map((r) => (
                  <label key={r}>
                    <input
                      type="checkbox"
                      checked={editData.roles?.includes(r)}
                      onChange={() => handleMultiSelect("roles", r)}
                    />
                    {r}
                  </label>
                ))}
              </div>

              <div className={styles.editInput}>
                <label>Skills (comma separated):</label>
                <input
                  type="text"
                  value={editData.skills?.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "skills",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                />
              </div>

              <div className={styles.editInput}>
                <label>Industries:</label>
                <input
                  type="text"
                  value={editData.industries?.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "industries",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                />
              </div>

              <div className={styles.editcheckbox}>
                <label>Looking For:</label>
                {lookingForOptions.map((opt) => (
                  <label key={opt}>
                    <input
                      type="checkbox"
                      checked={editData.lookingFor?.includes(opt)}
                      onChange={() => handleMultiSelect("lookingFor", opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>

              <div className={styles.editcheckbox}>
                <label>
                  <input
                    type="checkbox"
                    checked={editData.isOpenToCollaborate}
                    onChange={(e) =>
                      handleInputChange("isOpenToCollaborate", e.target.checked)
                    }
                  />
                  Open to Collaborate
                </label>
              </div>

              <button type="submit" className={styles.saveBtn}>
                <FaSave /> Save
              </button>
            </form>
          )}
        </div>

        {/* POSTS SECTION */}
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
                      <span onClick={() => handleLike(post._id)}>
                        <FaHeart /> {post.likes?.length || 0}
                      </span>
                      <span onClick={() => handleComment(post._id)}>
                        <FaComment /> {post.comments?.length || 0}
                      </span>
                      <FaShare />
                      {isOwnProfile && (
                        <FaTrash
                          onClick={() => handleDeletePost(post._id)}
                          style={{
                            marginLeft: "10px",
                            color: "red",
                            cursor: "pointer",
                          }}
                          title="Delete Post"
                        />
                      )}
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
