import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Home.css";
import { FaSearch, FaVideo, FaBell } from "react-icons/fa";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();

  // Search state
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

  // Feed data (demo)
  const feedData = [
    {
      id: 1,
      user: "Alex",
      room: "Comedy",
      text: "😂 That punchline had the whole room laughing!",
      comments: 87,
      avatar: "/assets/users/user1.jpg",
    },
    {
      id: 2,
      user: "Sophia",
      room: "Debate",
      text: "🔥 Today’s debate about AI ethics got intense!",
      comments: 102,
      avatar: "/assets/users/user2.jpg",
    },
    {
      id: 3,
      user: "Liam",
      room: "Travel",
      text: "🌍 Just shared my backpacking story across Europe!",
      comments: 45,
      avatar: "/assets/users/user3.jpg",
    },
    {
      id: 4,
      user: "Emma",
      room: "Books",
      text: "📚 Just finished ‘Atomic Habits’ – highly recommend!",
      comments: 64,
      avatar: "/assets/users/user4.jpg",
    },
  ];

  const categories = ["All", "Comedy", "Debate", "Travel", "Books"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filtered feed
  const filteredFeed =
    selectedCategory === "All"
      ? feedData
      : feedData.filter((item) => item.room === selectedCategory);

  return (
    <div className="home-page">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="logo">Nex</div>
        <div className="top-icons">
          <FaSearch className="icon" onClick={() => setIsSearchOpen(true)} />
          <FaBell className="icon" />
        </div>
      </header>

      {/* ✅ Full-Screen Search Overlay */}
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

      {/* ✅ Hide rest of feed when search is open */}
      {!isSearchOpen && (
        <>
          {/* Slim Scrollable Filter Bar */}
          <div className="filter-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${
                  selectedCategory === cat ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Social Feed */}
          <section className="feed-section">
            <h2 className="section-title">Trending Now</h2>

            {filteredFeed.map((item) => (
              <div className="feed-card" key={item.id}>
                <div className="feed-header">
                  <img
                    src={item.avatar}
                    alt={item.user}
                    className="feed-avatar"
                  />
                  <div>
                    <h4>{item.user}</h4>
                    <span className="feed-room">in {item.room} Room</span>
                  </div>
                </div>
                <p className="feed-text">{item.text}</p>
                <span className="feed-comments">{item.comments} comments</span>
              </div>
            ))}
          </section>

          {/* Floating Match Button */}
          <button className="match-btn" onClick={() => navigate("/video")}>
            <FaVideo className="match-icon" />
            <span>Start Match</span>
          </button>

          {/* Bottom Navbar */}
          <Navbar />
        </>
      )}
    </div>
  );
}
