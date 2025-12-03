import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/CompleteProfile.css"; // ✅ NEW CSS FILE

const API_URL = "https://nex-pjq3.onrender.com";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    age: "",
    location: "",
    interests: "",
  });

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        interests: form.interests.split(",").map((i) => i.trim()),
        profileCompleted: true,
      };

      await axios.put(`${API_URL}/api/profile/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/home");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="onboard-container">
      <div className="onboard-card fadeIn">
        {/* PROGRESS BAR */}
        <div className="progress-bar">
          <div className="progress" style={{ width: `${step * 25}%` }}></div>
        </div>

        <h2 className="onboard-title">Complete Your Profile</h2>
        <p className="onboard-subtitle">
          Let's set up your profile to help others know you better.
        </p>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="step fadeSlide">
            <label>Name</label>
            <input
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <button className="next-btn" onClick={nextStep}>
              Next
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="step fadeSlide">
            <label>Bio</label>
            <textarea
              placeholder="Tell something about yourself"
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
            />
            <div className="btn-row">
              <button className="back-btn" onClick={prevStep}>
                Back
              </button>
              <button className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="step fadeSlide">
            <label>Location</label>
            <input
              placeholder="City, Country"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />

            <label>Age</label>
            <input
              type="number"
              placeholder="Your age"
              value={form.age}
              onChange={(e) => handleChange("age", e.target.value)}
            />

            <div className="btn-row">
              <button className="back-btn" onClick={prevStep}>
                Back
              </button>
              <button className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="step fadeSlide">
            <label>Interests</label>
            <input
              placeholder="Startup, Tech, Marketing..."
              value={form.interests}
              onChange={(e) => handleChange("interests", e.target.value)}
            />

            <div className="btn-row">
              <button className="back-btn" onClick={prevStep}>
                Back
              </button>
              <button className="finish-btn" onClick={handleSubmit}>
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
