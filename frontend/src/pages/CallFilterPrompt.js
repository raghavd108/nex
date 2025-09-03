import React, { useState, useEffect } from "react";
import { FaGlobe, FaMapMarkerAlt, FaHeart } from "react-icons/fa";
import "../css/CallFilterPrompt.css";

export default function CallFilterPrompt({ onSubmit }) {
  const [activeOption, setActiveOption] = useState("nearby");
  const [interest, setInterest] = useState("dating");
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");

  // Fetch coordinates and reverse geocode state + country
  useEffect(() => {
    if (activeOption === "nearby") {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            const address = data.address;

            setState(address.state || "");
            setCountry(address.country || "");
          } catch (err) {
            console.error("Error fetching address info:", err);
          }
        },
        (error) => {
          console.error("Error fetching location", error);
          alert("Location access is required for Nearby matches.");
        }
      );
    }
  }, [activeOption]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      activeOption === "nearby" &&
      (!location.latitude || !location.longitude || !state || !country)
    ) {
      alert("Waiting for location and region info...");
      return;
    }

    onSubmit({
      interest,
      latitude: activeOption === "nearby" ? location.latitude : null,
      longitude: activeOption === "nearby" ? location.longitude : null,
      state: activeOption === "nearby" ? state : null,
      country: activeOption === "nearby" ? country : null,
      anywhere: activeOption === "anywhere",
    });
  };

  return (
    <div className="filter-popup">
      <form onSubmit={handleSubmit}>
        <div className="option-buttons">
          <div
            className={`option-icon ${
              activeOption === "nearby" ? "active" : ""
            }`}
            onClick={() => setActiveOption("nearby")}
          >
            <FaMapMarkerAlt />
            <span>Nearby</span>
          </div>

          <div
            className={`option-icon ${
              activeOption === "anywhere" ? "active" : ""
            }`}
            onClick={() => setActiveOption("anywhere")}
          >
            <FaGlobe />
            <span>Anywhere</span>
          </div>
        </div>

        <div className="form-group">
          <label>
            <FaHeart className="icon" />
            Interest:
          </label>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
          >
            <option value="dating">Dating</option>
            <option value="startup">Startup</option>
            <option value="employment">Employment</option>
            <option value="friendship">Friendship</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">
          Find Match
        </button>
      </form>
    </div>
  );
}
