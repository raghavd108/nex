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
} from "react-icons/fa";
import axios from "axios";
import MoodPopup from "../components/MoodPopup";

export default function Home() {
  const navigate = useNavigate();

  // 🔹 Mood state
  const [selectedMood, setSelectedMood] = useState(
    localStorage.getItem("lastMood") || "Neutral"
  );

  // 🔹 Theme colors
  const moodThemes = {
    Creative: "#FFB6C1",
    Ambitious: "#FF6347",
    Chill: "#87CEEB",
    Brainstorm: "#FFD700",
    Debate: "#8A2BE2",
    Neutral: "#f5f5f5",
  };

  // 🔹 Handle mood select
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.name);
    document.body.style.background = moodThemes[mood.name];
  };

  // 🔹 Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com";

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/profile/search`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const handleSelectUser = (username) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/profile/${username}`);
  };

  // 🔹 Dummy posts
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: "Ava (Designer)",
      avatar: "/assets/users/user1.jpg",
      mood: "Creative",
      caption: "New ideas flowing ✨",
      image:
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=60",
      likes: 12,
      comments: 3,
    },
    {
      id: 2,
      user: "Arjun (Founder)",
      avatar: "/assets/users/user2.jpg",
      mood: "Ambitious",
      caption: "Another step towards the dream 🚀",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=60",
      likes: 24,
      comments: 8,
    },
  ]);

  // 🔹 Post Composer
  const [newPost, setNewPost] = useState("");
  const [photo, setPhoto] = useState(null);

  const handlePost = () => {
    if (newPost.trim() === "" && !photo) return;

    const newEntry = {
      id: Date.now(),
      user: "You",
      avatar:
        "https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474358/nex-backgrounds/microphone-stool-on-stand-comedy-600nw-1031487514.jpg_mcmw3u.webp",
      mood: selectedMood,
      caption: newPost,
      image: photo ? URL.createObjectURL(photo) : null,
      likes: 0,
      comments: 0,
    };

    setPosts([newEntry, ...posts]);
    setNewPost("");
    setPhoto(null);
  };

  // Set theme color on load
  useEffect(() => {
    document.body.style.background = moodThemes[selectedMood];
  }, [selectedMood]);

  return (
    <div
      className="home-page"
      style={{
        background: moodThemes[selectedMood],
        transition: "background 0.5s ease",
      }}
    >
      {/* 🧠 Mood Greeting Popup */}
      <MoodPopup onSelect={handleMoodSelect} />

      {/* Top Bar */}
      <header className="top-bar">
        <div className="logo">Nex</div>
        <div className="top-icons">
          <FaSearch className="icon" onClick={() => setIsSearchOpen(true)} />
          <FaBell className="icon" />
        </div>
      </header>

      {/* 🔍 Search Overlay */}
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
                <img
                  src={
                    user.avatar ||
                    "https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474358/nex-backgrounds/microphone-stool-on-stand-comedy-600nw-1031487514.jpg_mcmw3u.webp"
                  }
                  alt={user.username}
                />
                <div className="profile-info">
                  <span className="name">{user.name || "Unnamed"}</span>
                  <span className="username">@{user.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔹 Social Feed */}
      {!isSearchOpen && (
        <>
          {/* 🧍‍♀️ Stories */}
          <div className="stories-bar">
            <div className="story your-story">
              <FaImage />
              <span>Your Story</span>
            </div>
            {["Ava", "Arjun", "Lia", "Nina", "Dev"].map((name, index) => (
              <div key={index} className="story">
                <img
                  src={`/assets/users/user${(index % 4) + 1}.jpg`}
                  alt={name}
                />
                <span>{name}</span>
              </div>
            ))}
          </div>

          {/* ✏️ Create Post */}
          <div className="post-composer">
            <img
              src="/assets/users/user1.jpg"
              alt="User"
              className="composer-avatar"
            />
            <textarea
              placeholder="Share your thoughts..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            ></textarea>
            <div className="composer-actions">
              <label className="upload-btn">
                <FaImage />{" "}
                <input
                  type="file"
                  onChange={(e) => setPhoto(e.target.files[0])}
                />
              </label>
              <button onClick={handlePost}>Post</button>
            </div>
          </div>

          {/* 📱 Feed Posts */}
          <div className="feed-section">
            {posts.map((post) => (
              <div key={post.id} className="feed-card">
                <div className="feed-header">
                  <img src={post.avatar} alt={post.user} />
                  <div>
                    <h4>{post.user}</h4>
                    <span>{post.mood} mood</span>
                  </div>
                </div>
                <p className="caption">{post.caption}</p>
                {post.image && (
                  <img src={post.image} alt="Post" className="feed-image" />
                )}
                <div className="feed-actions">
                  <FaHeart /> {post.likes}
                  <FaComment /> {post.comments}
                  <FaShare />
                </div>
              </div>
            ))}
          </div>

          {/* Floating Match Card */}
          <div className="match-card">
            <span className="card-title">Meet Someone Like You</span>
            <span className="card-subtitle">
              Your next connection is waiting!
            </span>
            <button className="card-btn" onClick={() => navigate("/video")}>
              Start Matching
            </button>
          </div>

          {/* Navbar */}
          <Navbar />
        </>
      )}
    </div>
  );
}
