// src/pages/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Home.css";
import { FaSearch, FaVideo } from "react-icons/fa"; // ✅ Font Awesome icons

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="logo">Nex</div>
        <div className="top-icons">
          <FaSearch className="icon" />
        </div>
      </header>

      {/* Match Section */}
      <section className="section">
        <h2 className="section-title">1 on 1 Match</h2>
        <div className="match-card" onClick={() => navigate("/video")}>
          <FaVideo className="match-icon" />
          <span className="match-text">Start</span>
        </div>
      </section>

      {/* Themed Rooms */}
      <section className="section">
        <h2 className="section-title">Themed Rooms</h2>
        <div className="room-grid">
          <div className="room-card">
            <img
              src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474349/nex-backgrounds/istockphoto-967283668-612x612_g8rgz1.jpg"
              alt="Debate"
            />
            <p>Debate Room</p>
          </div>
          <div className="room-card">
            <img
              src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474358/nex-backgrounds/microphone-stool-on-stand-comedy-600nw-1031487514.jpg_mcmw3u.webp"
              alt="Comedy"
            />
            <p>Comedy Club</p>
          </div>
          <div className="room-card">
            <img
              src="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1757474337/nex-backgrounds/0d1ef5572e0ecc7dad7cf62e5778ea8b_jza6lz.jpg"
              alt="Book"
            />
            <p>Book Club</p>
          </div>
        </div>
      </section>

      {/* Shopping Room */}
      <section className="section">
        <h2 className="section-title">Shopping Room</h2>
        <div className="shopping-card">
          <img src="/assets/products/headphones.jpg" alt="Headphones" />
          <div>
            <p className="shopping-text">Great conversation with Alex!</p>
            <span className="shopping-comments">123 comments</span>
          </div>
        </div>
        <div className="shopping-card">
          <img src="/assets/products/book.jpg" alt="Book" />
          <div>
            <p className="shopping-text">That book recommendation was gold!</p>
            <span className="shopping-comments">87 comments</span>
          </div>
        </div>
      </section>

      {/* Bottom Navbar */}
      <Navbar />
    </div>
  );
}
