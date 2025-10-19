// src/pages/CreateStartup.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileId(res.data._id);
      } catch (err) {
        console.error("Profile fetch failed", err);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleMultiSelect = (name, value) => {
    setForm((prev) => {
      const arr = prev[name];
      return arr.includes(value)
        ? { ...prev, [name]: arr.filter((v) => v !== value) }
        : { ...prev, [name]: [...arr, value] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, founderProfileId: profileId };
      const res = await axios.post(`${API_URL}/api/startups`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const startupId = res.data._id;

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

      navigate(`/startup/${startupId}`);
    } catch (err) {
      console.error(err);
      alert("Error creating startup");
    }
    setLoading(false);
  };

  const steps = [
    {
      label: "Startup Name",
      field: (
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="What's your startup called?"
        />
      ),
    },
    {
      label: "Mission",
      field: (
        <textarea
          name="mission"
          value={form.mission}
          onChange={handleChange}
          placeholder="What's your mission?"
        />
      ),
    },
    {
      label: "Description",
      field: (
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your idea..."
        />
      ),
    },
    {
      label: "Stage",
      field: (
        <select name="stage" value={form.stage} onChange={handleChange}>
          {stages.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      ),
    },
    {
      label: "Funding Info",
      field: (
        <input
          name="fundingInfo"
          value={form.fundingInfo}
          onChange={handleChange}
          placeholder="Funding details (optional)"
        />
      ),
    },
    {
      label: "Roles",
      field: (
        <div className="checkbox-group">
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
      ),
    },
    {
      label: "Industries",
      field: (
        <div className="checkbox-group">
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
      ),
    },
    {
      label: "Skills",
      field: (
        <input
          placeholder="Comma separated skills"
          value={form.skills.join(", ")}
          onChange={(e) =>
            setForm({
              ...form,
              skills: e.target.value.split(",").map((s) => s.trim()),
            })
          }
        />
      ),
    },
    {
      label: "Upload Logo",
      field: (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(e.target.files[0])}
        />
      ),
    },
    {
      label: "Upload Pitch Deck",
      field: (
        <input
          type="file"
          accept=".pdf,.ppt,.pptx"
          onChange={(e) => setPitchDeck(e.target.files[0])}
        />
      ),
    },
  ];

  return (
    <div
      className="create-startup-container fade-in"
      style={{ "--step": step }}
    >
      <h2>{steps[step].label}</h2>
      <form onSubmit={handleSubmit}>
        <div className="step-content">{steps[step].field}</div>
        <div className="step-nav">
          {step > 0 && (
            <button type="button" onClick={handlePrev}>
              ⬅ Back
            </button>
          )}
          {step < steps.length - 1 && (
            <button type="button" onClick={handleNext}>
              Next ➡
            </button>
          )}
          {step === steps.length - 1 && (
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Startup 🚀"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
