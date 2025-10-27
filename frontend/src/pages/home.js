import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Home.css";
import {
  FaSearch,
  FaBell,
  FaHeart,
  FaComment,
  FaShare,
  FaImage,
  FaPlus,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";
import MoodPopup from "../components/MoodPopup";

export default function Home() {
  const navigate = useNavigate();

  const [selectedMood, setSelectedMood] = useState(
    localStorage.getItem("lastMood") || "Neutral"
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    profiles: [],
    startups: [],
  });
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPostPopupOpen, setIsPostPopupOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com/api";

  // 🎨 Mood background gradients
  const moodGradients = {
    Creative: "linear-gradient(135deg, #ffafbd, #ffc3a0)",
    Ambitious: "linear-gradient(135deg, #ff416c, #ff4b2b)",
    Chill: "linear-gradient(135deg, #89f7fe, #66a6ff)",
    Brainstorm: "linear-gradient(135deg, #f9d423, #ff4e50)",
    Debate: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
    Neutral: "linear-gradient(135deg, #e0e0e0, #ffffff)",
  };

  useEffect(() => {
    const page = document.querySelector(".home-page");
    if (page) {
      page.style.setProperty("--mood-gradient", moodGradients[selectedMood]);
    }
  }, [selectedMood]);

  // ✅ Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // ✅ Fetch posts
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading posts:", err);
      setPosts([]);
    }
  };

  // ✅ Fetch stories
  const fetchStories = async () => {
    try {
      const res = await axios.get(`${API_URL}/story`);
      setStories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading stories:", err);
      setStories([]);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPosts();
    fetchStories();
  }, []);

  // ✅ Handle mood change
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.name);
    localStorage.setItem("lastMood", mood.name);
    document.body.style.background = moodGradients[mood.name];
    fetchPosts();
  };

  // ✅ Combined search
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults({ profiles: [], startups: [] });
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/search/all`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchResults(res.data || { profiles: [], startups: [] });
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults({ profiles: [], startups: [] });
    }
  };

  const handleSelectUser = (username) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ profiles: [], startups: [] });
    navigate(`/profile/${username}`);
  };

  const handleSelectStartup = (id) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ profiles: [], startups: [] });
    navigate(`/startup/${id}`);
  };

  // ✅ Create new post
  const handlePost = async () => {
    if (newPost.trim() === "" && !photo) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", newPost);
      formData.append("mood", selectedMood);
      if (photo) formData.append("image", photo);

      const res = await axios.post(`${API_URL}/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const postRes = await axios.get(`${API_URL}/posts/${res.data._id}`);
      setPosts((prev) => [postRes.data, ...prev]);
      setNewPost("");
      setPhoto(null);
      setIsPostPopupOpen(false);
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Like post
  const handleLike = async (postId) => {
    try {
      const res = await axios.post(
        `${API_URL}/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likes: res.data.likes } : p
        )
      );
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // ✅ Comment
  const handleComment = async (postId) => {
    const text = prompt("Write a comment:");
    if (!text) return;

    try {
      const res = await axios.post(
        `${API_URL}/posts/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // ✅ Delete post
  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return (
    <div
      className="home-page"
      style={{ background: moodGradients[selectedMood], transition: "0.5s" }} // ✅ fixed here too
    >
      <MoodPopup onSelect={handleMoodSelect} />

      <header className="top-bar">
        <div className="logo">Nex</div>
        <div className="top-icons">
          <FaSearch className="icon" onClick={() => setIsSearchOpen(true)} />
          <FaBell className="icon" />
          <FaComment className="icon" onClick={() => navigate("/match")} />
        </div>
      </header>

      {/* ✅ Search Overlay */}
      {isSearchOpen && (
        <div className="search-overlay">
          <div className="search-header">
            <input
              type="text"
              placeholder="Search users or startups..."
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
            />
            <button
              className="close-btn"
              onClick={() => setIsSearchOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="search-results-container">
            {/* Users Section */}
            {searchResults.profiles?.length > 0 && (
              <>
                <h4 className="result-category">People</h4>
                {searchResults.profiles.map((user) => (
                  <div
                    key={user._id}
                    className="profile-preview"
                    onClick={() => handleSelectUser(user.username)}
                  >
                    <img src={user.avatar} alt={user.username} />
                    <div className="profile-info">
                      <span className="name">{user.name || "Unnamed"}</span>
                      <span className="username">@{user.username}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Startups Section */}
            {searchResults.startups?.length > 0 && (
              <>
                <h4 className="result-category">Startups</h4>
                {searchResults.startups.map((startup) => (
                  <div
                    key={startup._id}
                    className="profile-preview"
                    onClick={() => handleSelectStartup(startup._id)}
                  >
                    <img src={startup.logo} alt={startup.name} />
                    <div className="profile-info">
                      <span className="name">{startup.name}</span>
                      <span className="username">
                        {startup.stage || "Startup"}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* No Results */}
            {searchQuery &&
              !searchResults.profiles?.length &&
              !searchResults.startups?.length && (
                <p className="no-results">No users or startups found</p>
              )}
          </div>
        </div>
      )}

      {/* ✅ Feed */}
      <div className="feed-section">
        {Array.isArray(posts) &&
          posts.map((post) => (
            <div key={post._id} className="feed-card">
              <div className="feed-header">
                <img src={post.userId?.avatar} alt={post.userId?.username} />
                <div>
                  <h4>{post.userId?.name || "User"}</h4>
                  <span>{post.mood || "Neutral"} mood</span>
                </div>
              </div>

              <p className="caption">{post.content}</p>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="Post" className="feed-image" />
              )}

              <div className="feed-actions">
                <span onClick={() => handleLike(post._id)}>
                  <FaHeart />{" "}
                  {Array.isArray(post.likes) ? post.likes.length : 0}
                </span>
                <span onClick={() => handleComment(post._id)}>
                  <FaComment />{" "}
                  {Array.isArray(post.comments) ? post.comments.length : 0}
                </span>
                <FaShare />
                {post.userId?._id === userProfile?._id && (
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
          ))}
      </div>

      {/* ✅ Create Post Popup */}
      <button
        className="open-post-btn"
        onClick={() => setIsPostPopupOpen(true)}
      >
        <FaPlus /> Post
      </button>

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
              <div className="composer-avatar">
                <img src={userProfile?.avatar} alt="Avatar" />
              </div>
              <textarea
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              {photo && (
                <img
                  src={URL.createObjectURL(photo)}
                  alt="Preview"
                  style={{ borderRadius: "12px", maxHeight: "150px" }}
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
                <button onClick={handlePost} disabled={loading}>
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}
