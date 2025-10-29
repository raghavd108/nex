// src/pages/StartupProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import "../css/StartupProfile.css";
import {
  FaPlus,
  FaTimes,
  FaImage,
  FaTrash,
  FaHeart,
  FaRegHeart,
  FaComment,
} from "react-icons/fa";

export default function StartupProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [startup, setStartup] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFounder, setIsFounder] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [userProfile, setUserProfile] = useState(null);

  // Post states
  const [isPostPopupOpen, setIsPostPopupOpen] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [photo, setPhoto] = useState(null);
  const [posting, setPosting] = useState(false);

  // Team (future use)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com/api";

  // =================== Fetch Startup Data ===================
  useEffect(() => {
    const fetchStartup = async () => {
      if (!token) return alert("Login required");
      try {
        const [startupRes, profileRes] = await Promise.all([
          axios.get(`${API_URL}/startups/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const startupData = startupRes.data;
        const profileData = profileRes.data;
        setUserProfile(profileData);

        const myProfileId = profileData._id;

        setStartup(startupData);
        setFormData({
          name: startupData.name || "",
          mission: startupData.mission || "",
          description: startupData.description || "",
          stage: startupData.stage || "idea",
          fundingInfo: startupData.fundingInfo || "",
          industries: startupData.industries || [],
          skills: startupData.skills || [],
          logo: startupData.logo || "",
        });

        setFollowing(
          startupData.followers?.some((f) =>
            typeof f === "string" ? f === myProfileId : f._id === myProfileId
          )
        );

        setIsFounder(
          startupData.founderProfileId === myProfileId ||
            startupData.founderProfileId?._id === myProfileId
        );

        // Fetch posts
        const postsRes = await axios.get(`${API_URL}/startupPosts/${id}`);
        setStartup((prev) => ({ ...prev, posts: postsRes.data || [] }));
      } catch (err) {
        console.error("Failed to fetch startup:", err);
        alert("Error fetching startup data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStartup();
  }, [id, token]);

  // =================== Follow / Unfollow ===================
  const toggleFollow = async () => {
    try {
      await axios.post(
        `${API_URL}/startups/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowing((prev) => !prev);
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
      alert("Error updating follow status");
    }
  };

  // =================== Edit Startup Info ===================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, logo: file }));
  };

  const handleUpdate = async () => {
    try {
      const updatedData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key]))
          updatedData.append(key, JSON.stringify(formData[key]));
        else updatedData.append(key, formData[key]);
      });

      const res = await axios.put(`${API_URL}/startups/${id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setStartup(res.data.startup || res.data);
      setEditing(false);
      alert("✅ Startup updated successfully!");
    } catch (err) {
      console.error("Error updating startup:", err);
      alert("❌ Failed to update startup.");
    }
  };

  // =================== Create Post ===================
  const handlePost = async () => {
    if (!newPost.trim()) return alert("Write something!");
    setPosting(true);
    try {
      const form = new FormData();
      form.append("content", newPost);
      if (photo) form.append("image", photo);

      const res = await axios.post(`${API_URL}/startupPosts/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStartup((prev) => ({
        ...prev,
        posts: [res.data, ...(prev.posts || [])],
      }));
      setNewPost("");
      setPhoto(null);
      setIsPostPopupOpen(false);
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to share post.");
    } finally {
      setPosting(false);
    }
  };

  // =================== Like Post ===================
  const handleLike = async (postId) => {
    try {
      const res = await axios.put(
        `${API_URL}/startupPosts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStartup((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p._id === postId ? res.data : p)),
      }));
    } catch (err) {
      console.error("Error liking post:", err.response?.data || err.message);
    }
  };

  // =================== Comment on Post ===================
  const handleComment = async (postId) => {
    const text = prompt("💬 Write a comment:");
    if (!text?.trim()) return;

    try {
      const res = await axios.post(
        `${API_URL}/startupPosts/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStartup((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p._id === postId ? res.data : p)),
      }));
    } catch (err) {
      console.error("Error commenting:", err.response?.data || err.message);
    }
  };

  // =================== Delete Post ===================
  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/startupPosts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStartup((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p._id !== postId),
      }));
    } catch (err) {
      console.error("Error deleting post:", err.response?.data || err.message);
      alert("Failed to delete post.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!startup) return <p>Startup not found.</p>;

  return (
    <div>
      <Navbar />
      <div className="startup-profile-page">
        {/* ======= Header ======= */}
        <div className="profile-header">
          <img
            src={
              typeof startup.logo === "string" && startup.logo
                ? startup.logo
                : "/default-logo.png"
            }
            alt="Logo"
            className="startup-logo"
          />

          <div className="profile-info">
            <h1>{startup.name}</h1>
            <p>{startup.mission}</p>
          </div>

          <div className="profile-actions">
            <button className="follow-btn" onClick={toggleFollow}>
              {following ? "✅ Following" : "➕ Follow"}
            </button>

            {isFounder && (
              <button className="edit-btn" onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        {/* ======= Edit Modal ======= */}
        {editing && (
          <div className="edit-modal-overlay">
            <div className="edit-modal">
              <h2>Edit Startup Profile</h2>
              <label>Logo:</label>
              <input type="file" onChange={handleFileChange} />
              <label>Mission:</label>
              <textarea
                name="mission"
                value={formData.mission || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mission: e.target.value }))
                }
              />
              <label>Stage:</label>
              <input
                name="stage"
                value={formData.stage || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stage: e.target.value }))
                }
              />
              <label>Industries:</label>
              <input
                name="industries"
                value={formData.industries?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industries: e.target.value.split(",").map((i) => i.trim()),
                  })
                }
              />
              <label>Funding Info:</label>
              <input
                name="fundingInfo"
                value={formData.fundingInfo || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fundingInfo: e.target.value,
                  }))
                }
              />
              <div className="edit-btns">
                <button className="save-btn" onClick={handleUpdate}>
                  💾 Save
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setEditing(false)}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======= Info Section ======= */}
        <div className="info-section card">
          <h3>About Startup</h3>
          <p>
            <strong>Stage:</strong> {startup.stage}
          </p>
          <p>
            <strong>Industries:</strong> {startup.industries?.join(", ")}
          </p>
          <p>
            <strong>Funding:</strong> {startup.fundingInfo}
          </p>
          <p>
            <strong>Followers:</strong> {startup.followers?.length}
          </p>
        </div>

        {/* ======= Create Post Button ======= */}
        {isFounder && (
          <button
            className="open-post"
            onClick={() => setIsPostPopupOpen(true)}
          >
            <FaPlus /> Post
          </button>
        )}

        {/* ======= Post Popup ======= */}
        {isPostPopupOpen && (
          <div className="post-popup-overlay">
            <div className="post-popup">
              <div className="popup-header">
                <h3>Create Post</h3>
                <button onClick={() => setIsPostPopupOpen(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="popup-body">
                <div className="composer-startup">
                  <img
                    src={
                      typeof startup.logo === "string" && startup.logo
                        ? startup.logo
                        : "/default-logo.png"
                    }
                    alt="Startup Logo"
                  />
                  <div className="startup-name-info">
                    <h4>{startup.name}</h4>
                  </div>
                </div>

                <textarea
                  placeholder={`What's new at ${startup.name}?`}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />

                {photo && (
                  <img
                    src={URL.createObjectURL(photo)}
                    alt="Preview"
                    className="post-preview"
                  />
                )}

                <div className="composer-actions">
                  <label className="upload-btn">
                    <FaImage /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files[0])}
                    />
                  </label>
                  <button onClick={handlePost} disabled={posting}>
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======= Posts Section ======= */}
        <div className="posts-section card">
          <h3>Startup Updates 📢</h3>
          {startup.posts && startup.posts.length > 0 ? (
            startup.posts.map((post) => {
              const isLiked = post.likes?.some(
                (l) => (typeof l === "string" ? l : l._id) === userProfile?._id
              );

              return (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <img
                      src={
                        post.startupId?.logo ||
                        startup.logo ||
                        "/default-logo.png"
                      }
                      alt="startup"
                      className="avatar"
                    />
                    <div>
                      <strong>{post.startupId?.name || startup.name}</strong>
                      <p className="date">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {isFounder && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDeletePost(post._id)}
                        title="Delete post"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  <p className="content">{post.content}</p>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="post-image"
                    />
                  )}

                  <div className="post-actions">
                    <button
                      className={`like-btn ${isLiked ? "liked" : ""}`}
                      onClick={() => handleLike(post._id)}
                      title={isLiked ? "Unlike" : "Like"}
                    >
                      {isLiked ? <FaHeart /> : <FaRegHeart />}{" "}
                      <span>{post.likes?.length || 0}</span>
                    </button>

                    <button
                      className="comment-btn"
                      onClick={() => handleComment(post._id)}
                      title="Comment"
                    >
                      <FaComment /> <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
