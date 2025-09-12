import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Home.css";
import { FaSearch, FaVideo, FaBell } from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="logo">Nex</div>
        <div className="top-icons">
          <FaSearch className="icon" />
          <FaBell className="icon" />
        </div>
      </header>

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

      {/* Social Feed */}
      <section className="feed-section">
        <h2 className="section-title">Trending Now</h2>

        <div className="feed-card">
          <div className="feed-header">
            <img
              src="/assets/users/user1.jpg"
              alt="User"
              className="feed-avatar"
            />
            <div>
              <h4>Alex</h4>
              <span className="feed-room">in Comedy Club</span>
            </div>
          </div>
          <p className="feed-text">
            😂 That punchline had the whole room laughing!
          </p>
          <span className="feed-comments">87 comments</span>
        </div>

        <div className="feed-card">
          <div className="feed-header">
            <img
              src="/assets/users/user2.jpg"
              alt="User"
              className="feed-avatar"
            />
            <div>
              <h4>Sophia</h4>
              <span className="feed-room">in Debate Room</span>
            </div>
          </div>
          <p className="feed-text">
            🔥 Today’s debate about AI ethics got intense!
          </p>
          <span className="feed-comments">102 comments</span>
        </div>
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
