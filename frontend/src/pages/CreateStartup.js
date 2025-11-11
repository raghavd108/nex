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
    skills: [],
  });
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com";

  useEffect(() => {
    axios.get(`${API_URL}/api/health`).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileId(res.data._id);
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((v) => v !== value)
        : [...prev[name], value],
    }));
  };

  const handleFileChange = (setter) => (e) => {
    const files = Array.from(e.target.files);
    setter(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profileId) {
      alert("Profile is still loading, please wait 1 second.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        founderProfileId: profileId,
        roles: form.roles || [],
        skills: form.skills || [],
      };

      const res = await axios.post(`${API_URL}/api/startups`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const startupId = res.data._id;

      let mainLogoUrl = "";

      if (logos.length > 0) {
        const logoFormData = new FormData();
        logos.forEach((file) => logoFormData.append("logos", file));
        const logoRes = await axios.post(
          `${API_URL}/api/startups/${startupId}/logos`,
          logoFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        mainLogoUrl = logoRes.data[0]?.url || "";
      }

      if (mainLogoUrl) {
        await axios.put(
          `${API_URL}/api/startups/${startupId}`,
          { logo: mainLogoUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      navigate(`/startup/${startupId}`);
    } catch (err) {
      console.error("Error creating startup:", err);
      alert("Failed to create startup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: "Startup Name",
      field: (
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Startup name"
          required
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
          placeholder="Your mission"
          required
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
          placeholder="Describe your startup idea"
          required
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
          placeholder="Funding info (optional)"
        />
      ),
    },
    {
      label: "Roles Needed",
      field: (
        <div className="checkbox-group">
          {rolesList.map((r) => (
            <label key={r}>
              <input
                type="checkbox"
                checked={form.roles.includes(r)}
                onChange={() => handleMultiSelect("roles", r)}
              />{" "}
              {r}
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
              skills: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      ),
    },
    {
      label: "Upload Logos (Multiple Allowed)",
      field: (
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange(setLogos)}
        />
      ),
    },
  ];

  if (!profileId)
    return (
      <div className="create-startup-container">
        <h2>Loading profile...</h2>
      </div>
    );

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
            <button type="submit" disabled={loading || !profileId}>
              {loading ? "Creating..." : "Create Startup 🚀"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
