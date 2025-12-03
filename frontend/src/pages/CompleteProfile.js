import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "https://nex-pjq3.onrender.com";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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
    <div style={{ padding: 20 }}>
      <h2>Create Your Profile</h2>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <textarea
        placeholder="Bio"
        value={form.bio}
        onChange={(e) => handleChange("bio", e.target.value)}
      />

      <input
        type="number"
        placeholder="Age"
        value={form.age}
        onChange={(e) => handleChange("age", e.target.value)}
      />

      <input
        placeholder="Location"
        value={form.location}
        onChange={(e) => handleChange("location", e.target.value)}
      />

      <input
        placeholder="Interests (comma separated)"
        value={form.interests}
        onChange={(e) => handleChange("interests", e.target.value)}
      />

      <button onClick={handleSubmit}>Save & Continue</button>
    </div>
  );
}
