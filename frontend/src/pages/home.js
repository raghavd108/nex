import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Home.css";
import { FaSearch, FaVideo, FaBell } from "react-icons/fa";
import axios from "axios";
import MoodPopup from "../components/MoodPopup";

export default function Home() {
  const navigate = useNavigate();

  // 🔹 Mood state
  const [selectedMood, setSelectedMood] = useState(
    localStorage.getItem("lastMood") || "Neutral"
  );

  // 🔹 Dynamic theme colors per mood
  const moodThemes = {
    Creative: "#FFB6C1",
    Ambitious: "#FF6347",
    Chill: "#87CEEB",
    Brainstorm: "#FFD700",
    Debate: "#8A2BE2",
    Neutral: "#f5f5f5",
  };

  // 🔹 Suggested people per mood
  const moodSuggestions = {
    Creative: ["Ava (Designer)", "Leo (Musician)", "Zara (Photographer)"],
    Ambitious: ["Arjun (Founder)", "Maya (Marketer)", "Ethan (Coder)"],
    Chill: ["Lia (Gamer)", "Noah (Streamer)", "Tia (Traveler)"],
    Brainstorm: ["Nina (Innovator)", "Ray (Thinker)", "Sam (Strategist)"],
    Debate: ["Aiden (Law Student)", "Clara (Analyst)", "Dev (Political Buff)"],
    Neutral: ["Alex (Explorer)", "Emma (Learner)", "Ryan (Creator)"],
  };

  // 🔹 Handle mood selection
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.name);
    document.body.style.background = moodThemes[mood.name];
  };

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

  // Set theme color when page loads
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

      {/* ✅ Hide rest when search is open */}
      {!isSearchOpen && (
        <>
          {/* Suggested People Section */}
          <section className="suggested-section">
            <h3>
              Suggested for You <span>({selectedMood} Mood)</span>
            </h3>
            <div className="suggested-list">
              {moodSuggestions[selectedMood]?.map((person, index) => (
                <div key={index} className="suggested-card">
                  <img
                    src={`/assets/users/user${(index % 4) + 1}.jpg`}
                    alt={person}
                  />
                  <span>{person}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Floating Match Button */}
          <div className="match-card">
            <span className="card-title">Meet Someone Like You</span>
            <span className="card-subtitle">
              Your next connection is waiting!
            </span>
            <button className="card-btn" onClick={() => navigate("/video")}>
              Start Matching
            </button>
          </div>

          {/* Bottom Navbar */}
          <Navbar />
        </>
      )}
    </div>
  );
}
