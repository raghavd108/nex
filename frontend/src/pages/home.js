// src/pages/Home.js
import React from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

import "../css/Home.css";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <img src="/assets/logo.png" alt="Nex Logo" className="hero-logo" />
          <h1 className="hero-title">Nex: Where Real Connections Begin ✨</h1>
          <p className="hero-subtitle">
            Meet friends, partners, co-founders & more — all in one place.
          </p>
          <button className="cta-button" onClick={() => navigate("/video")}>
            Get Started
          </button>
        </div>
      </header>

      {/* Journey Section */}
      <section className="journey-section">
        <h2 className="section-title">Choose Your Journey</h2>
        <div className="journey-grid">
          <JourneyCard
            image="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1756746217/nex-backgrounds/f5_c0xdbj.jpg"
            title="Friendship"
            text="Make deep and lasting friendships—beyond the swipe."
            buttonText="Explore Friends"
          />
          <JourneyCard
            image="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1756746216/nex-backgrounds/l1_qpzsaa.jpg"
            title="Love"
            text="Date with intent. No pressure. No games."
            buttonText="Find Love"
          />
          <JourneyCard
            image="https://res.cloudinary.com/dwn4lzyyf/image/upload/v1756746216/nex-backgrounds/c01_lputka.jpg"
            title="Co-Founders"
            text="Match with builders, makers, and visionaries like you."
            buttonText="Meet Founders"
          />
        </div>
      </section>

      {/* Community Proof Section */}
      <section className="community-section">
        <h2 className="section-title">Global Community 🌍</h2>
        <p className="community-text">
          Thousands of meaningful connections every day across 50+ countries.
        </p>
        <div className="avatars-marquee">
          <img src="/assets/users/u1.jpg" alt="User 1" />
          <img src="/assets/users/u2.jpg" alt="User 2" />
          <img src="/assets/users/u3.jpg" alt="User 3" />
          <img src="/assets/users/u4.jpg" alt="User 4" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Nex is Different</h2>
        <ul className="features-list">
          <li>🎯 Intent-based matching, not just random swipes</li>
          <li>🔒 Safety-first design with real-time moderation</li>
          <li>📍 Smart filters — nearby people, shared goals, common vibes</li>
          <li>💬 Live video rooms, events, and icebreakers</li>
          <li>📈 Mood & emotion-aware interactions (AI-powered)</li>
        </ul>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">Stories That Warm the Heart 💖</h2>
        <div className="testimonial-cards">
          <Testimonial
            name="Rhea & Arjun"
            text="We met on Nex, started talking, and now we’re planning our first startup together. It’s surreal!"
          />
          <Testimonial
            name="Jiya"
            text="The friend I made here literally changed my life. No algorithms — just vibe and realness."
          />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="final-cta">
        <h2>Ready to meet your people?</h2>
        <p>Real. Intentional. Global. Nex is where it starts.</p>
        <button className="cta-button" onClick={() => navigate("/signup")}>
          Join Now
        </button>
      </section>

      <Navbar />
    </div>
  );
}

function JourneyCard({ image, title, text, buttonText }) {
  return (
    <div className="journey-card">
      <img src={image} alt={title} />
      <div className="overlay">
        <h3>{title}</h3>
        <p>{text}</p>
        <button>{buttonText}</button>
      </div>
    </div>
  );
}

function Testimonial({ name, text }) {
  return (
    <div className="testimonial-card">
      <p className="testimonial-text">“{text}”</p>
      <p className="testimonial-name">— {name}</p>
    </div>
  );
}
