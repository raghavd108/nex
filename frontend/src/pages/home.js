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
  const [searchResults, setSearchResults] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPostPopupOpen, setIsPostPopupOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isViewingStory, setIsViewingStory] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com/api";

  const moodThemes = {
    Creative: "#FFB6C1",
    Ambitious: "#FF6347",
    Chill: "#87CEEB",
    Brainstorm: "#FFD700",
    Debate: "#8A2BE2",
    Neutral: "#f5f5f5",
  };

  useEffect(() => {
    document.body.style.background = moodThemes[selectedMood];
  }, [selectedMood]);

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

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts`);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading posts:", err);
      setPosts([]);
    }
  };

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

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.name);
    localStorage.setItem("lastMood", mood.name);
    document.body.style.background = moodThemes[mood.name];
    fetchPosts();
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/profile/search`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
    }
  };

  const handleSelectUser = (username) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/profile/${username}`);
  };

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

      const postWithUser = { ...res.data, userId: userProfile };
      setPosts((prev) => [postWithUser, ...prev]);
      setNewPost("");
      setPhoto(null);
      setIsPostPopupOpen(false);
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(
        `${API_URL}/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likes: Array.isArray(res.data.likes) ? res.data.likes : [],
              }
            : p
        )
      );
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

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

  const handleUploadStory = async (file) => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("story", file);

      await axios.post(`${API_URL}/story/story`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      fetchStories(); // Refresh stories
    } catch (err) {
      console.error("Error uploading story:", err);
    } finally {
      setLoading(false);
    }
  };

  const userStory =
    Array.isArray(stories) && stories.length > 0 && userProfile
      ? stories.find((s) => s.userId?._id === userProfile._id)
      : null;

  const handleViewStory = (story) => {
    setCurrentStory(story);
    setIsViewingStory(true);
  };

  return (
    <div
      className="home-page"
      style={{ background: moodThemes[selectedMood], transition: "0.5s" }}
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

      {isSearchOpen && (
        <div className="search-overlay">
          <div className="search-header">
            <input
              type="text"
              placeholder="Search users..."
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
            {searchResults.length === 0 && searchQuery !== "" && (
              <p className="no-results">No users found</p>
            )}
            {searchResults.map((user) => (
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
          </div>
        </div>
      )}

      {/* Stories */}
      <div className="stories-bar">
        <div className="story your-story">
          <div
            onClick={() =>
              userStory
                ? handleViewStory(userStory)
                : document.getElementById("storyInput")?.click()
            }
          >
            <img src={userProfile?.avatar} alt="Your Story" />
            {!userStory && <FaPlus className="add-icon" />}
          </div>
          <span>{userStory ? "Your Story" : "Add Story"}</span>
        </div>
        <input
          type="file"
          id="storyInput"
          style={{ display: "none" }}
          onChange={(e) => handleUploadStory(e.target.files[0])}
        />

        {Array.isArray(stories) &&
          stories
            .filter((s) => s.userId?._id !== userProfile?._id)
            .map((s) => (
              <div
                className="story"
                key={s._id}
                onClick={() => handleViewStory(s)}
              >
                <img src={s.userId?.avatar} alt={s.userId?.name} />
                <span>{s.userId?.name}</span>
              </div>
            ))}
      </div>

      {/* Fullscreen Story Viewer */}
      {isViewingStory && currentStory && (
        <div className="story-fullscreen">
          <button
            className="close-story"
            onClick={() => setIsViewingStory(false)}
          >
            <FaTimes />
          </button>
          <img
            src={currentStory.storyUrl}
            alt="Story"
            className="fullscreen-story-image"
          />
        </div>
      )}

      {/* Feed */}
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
              </div>
            </div>
          ))}
      </div>
      {/* Floating Post Button */}
      <button
        className="open-post-btn"
        onClick={() => setIsPostPopupOpen(true)}
      >
        <FaPlus /> Post
      </button>

      {/* Post Popup */}
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
