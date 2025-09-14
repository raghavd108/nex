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
        params: { username: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const handleSelectUser = (userId) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/profile/${userId}`);
  };

  // Feed data
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
          <FaSearch
            className="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          />
          <FaBell className="icon" />
        </div>
      </header>

      {/* Search Box */}
      {isSearchOpen && (
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map((user) => (
                <li
                  key={user._id}
                  className="search-item"
                  onClick={() => handleSelectUser(user._id)}
                >
                  <img
                    src={
                      user.avatar ||
                      "https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474358/nex-backgrounds/microphone-stool-on-stand-comedy-600nw-1031487514.jpg_mcmw3u.webp"
                    }
                    alt={user.username}
                    className="search-avatar"
                  />
                  <span>@{user.username}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Themed Rooms / Stories */}
      <section className="stories-section">
        <h2 className="section-title">Discover Rooms</h2>
        <div className="stories-row">
          <div className="story-card">
            <img
              src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474349/nex-backgrounds/istockphoto-967283668-612x612_g8rgz1.jpg"
              alt="Debate"
            />
            <p>Debate</p>
          </div>
          <div className="story-card">
            <img
              src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474358/nex-backgrounds/microphone-stool-on-stand-comedy-600nw-1031487514.jpg_mcmw3u.webp"
              alt="Comedy"
            />
            <p>Comedy</p>
          </div>
          <div className="story-card">
            <img
              src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474337/nex-backgrounds/0d1ef5572e0ecc7dad7cf62e5778ea8b_jza6lz.jpg"
              alt="Books"
            />
            <p>Books</p>
          </div>
          <div className="story-card">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
              alt="Travel"
            />
            <p>Travel</p>
          </div>
        </div>
      </section>

      {/* Slim Scrollable Filter Bar */}
      <div className="filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
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
              <img src={item.avatar} alt={item.user} className="feed-avatar" />
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
    </div>
  );
}
