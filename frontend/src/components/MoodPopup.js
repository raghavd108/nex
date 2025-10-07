import React, { useState, useEffect } from "react";
import "../css/MoodPopup.css";

const moods = [
  { name: "Creative", emoji: "🎨", color: "#FFB6C1" },
  { name: "Ambitious", emoji: "🔥", color: "#FF4500" },
  { name: "Chill", emoji: "🎮", color: "#87CEFA" },
  { name: "Brainstorm", emoji: "💡", color: "#FFD700" },
  { name: "Debate", emoji: "💬", color: "#8A2BE2" },
];

export default function MoodPopup({ onSelect }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastMoodTime = localStorage.getItem("lastMoodTime");
    const now = Date.now();
    if (!lastMoodTime || now - lastMoodTime > 4 * 60 * 60 * 1000) {
      setShow(true);
    }
  }, []);

  const handleMoodSelect = (mood) => {
    localStorage.setItem("lastMood", mood.name);
    localStorage.setItem("lastMoodTime", Date.now());
    onSelect(mood);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="mood-popup-overlay">
      <div className="mood-popup-card">
        <h2>Hey Raghav 👋</h2>
        <p>What’s your vibe today?</p>
        <div className="mood-options">
          {moods.map((mood) => (
            <button
              key={mood.name}
              className="mood-btn"
              style={{ backgroundColor: mood.color }}
              onClick={() => handleMoodSelect(mood)}
            >
              {mood.emoji} {mood.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
