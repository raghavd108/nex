import React, { useState, useEffect } from "react";
import axios from "axios";

import "../css/CreateStartup.css";

const stages = ["idea", "MVP", "seed", "growth", "scaling"];
const rolesList = [
  "Founder",
  "Co-founder",
  "Investor",
  "Mentor",
  "Developer",
  "Designer",
  "Marketer",
];
const industriesList = ["AI", "Fintech", "Health", "Edtech", "E-commerce"];

export default function CreateStartup() {
  const [form, setForm] = useState({
    name: "",
    mission: "",
    description: "",
    stage: "idea",
    fundingInfo: "",
    roles: [],
    industries: [],
    skills: [],
  });
  const [logo, setLogo] = useState(null);
  const [pitchDeck, setPitchDeck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com";

  // ✅ Fetch logged-in user's profile ID
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileId(res.data._id);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleMultiSelect = (name, value) => {
    setForm((prev) => {
      const current = prev[name];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [name]: [...current, value] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileId) {
      alert("Profile not loaded yet!");
      return;
    }

    setLoading(true);
    try {
      // ✅ Add founderProfileId automatically
      const payload = { ...form, founderProfileId: profileId };

      const res = await axios.post(`${API_URL}/api/startups`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const startupId = res.data._id;

      // Upload logo if exists
      if (logo) {
        const logoData = new FormData();
        logoData.append("logo", logo);
        await axios.post(
          `${API_URL}/api/startups/${startupId}/logo`,
          logoData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Upload pitch deck if exists
      if (pitchDeck) {
        const deckData = new FormData();
        deckData.append("pitchDeck", pitchDeck);
        await axios.post(
          `${API_URL}/api/startups/${startupId}/pitchdeck`,
          deckData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      alert("Startup created successfully!");
      setForm({
        name: "",
        mission: "",
        description: "",
        stage: "idea",
        fundingInfo: "",
        roles: [],
        industries: [],
        skills: [],
      });
      setLogo(null);
      setPitchDeck(null);
    } catch (err) {
      console.error(err);
      alert("Error creating startup");
    }
    setLoading(false);
  };

  return (
    <div className="create-startup-container">
      <h2>Create a Startup</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Startup Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="mission"
          placeholder="Mission"
          value={form.mission}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <label>Stage:</label>
        <select name="stage" value={form.stage} onChange={handleChange}>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          name="fundingInfo"
          placeholder="Funding Info"
          value={form.fundingInfo}
          onChange={handleChange}
        />

        <div>
          <label>Roles:</label>
          {rolesList.map((r) => (
            <label key={r}>
              <input
                type="checkbox"
                checked={form.roles.includes(r)}
                onChange={() => handleMultiSelect("roles", r)}
              />
              {r}
            </label>
          ))}
        </div>

        <div>
          <label>Industries:</label>
          {industriesList.map((i) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={form.industries.includes(i)}
                onChange={() => handleMultiSelect("industries", i)}
              />
              {i}
            </label>
          ))}
        </div>

        <div>
          <label>Skills (comma separated):</label>
          <input
            placeholder="e.g. Marketing, AI"
            value={form.skills.join(", ")}
            onChange={(e) =>
              setForm({
                ...form,
                skills: e.target.value.split(",").map((s) => s.trim()),
              })
            }
          />
        </div>

        <div>
          <label>Logo:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files[0])}
          />
        </div>

        <div>
          <label>Pitch Deck:</label>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx"
            onChange={(e) => setPitchDeck(e.target.files[0])}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Startup"}
        </button>
      </form>
    </div>
  );
}
