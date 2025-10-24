// src/pages/StartupProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import "../css/StartupProfile.css";

export default function StartupProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [startup, setStartup] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFounder, setIsFounder] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com/api";

  useEffect(() => {
    const fetchStartup = async () => {
      if (!token) {
        alert("You must be logged in to view this startup.");
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/startups/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStartup(res.data);
        setFormData(res.data);

        const profileRes = await axios.get(`${API_URL}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myProfileId = profileRes.data._id;
        setFollowing(res.data.followers?.some((f) => f._id === myProfileId));
        setIsFounder(
          res.data.founderProfileId === myProfileId ||
            res.data.founderProfileId?._id === myProfileId
        );
      } catch (err) {
        console.error("Failed to fetch startup", err);
        alert("Error fetching startup data");
      }
      setLoading(false);
    };
    fetchStartup();
  }, [id, token]);

  const toggleFollow = async () => {
    if (!token) return alert("Login required");
    try {
      await axios.post(
        `${API_URL}/startups/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowing((prev) => !prev);
    } catch (err) {
      console.error("Follow/unfollow failed", err);
      alert("Error updating follow status");
    }
  };

  const handleEditClick = () => setEditing(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, logo: e.target.files[0] }));
  };

  const handleUpdate = async () => {
    if (!token) return alert("Login required");
    try {
      const updatedData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) {
          updatedData.append(key, JSON.stringify(formData[key]));
        } else {
          updatedData.append(key, formData[key]);
        }
      });

      await axios.put(`${API_URL}/startups/${id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Startup profile updated successfully!");
      setStartup(formData);
      setEditing(false);
    } catch (err) {
      console.error("Error updating startup:", err);
      alert("Failed to update startup profile");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!startup) return <p>Startup not found.</p>;

  return (
    <div>
      <Navbar />
      <div className="startup-profile-page">
        <div className="banner"></div>

        <div className="profile-header">
          <img
            src={
              startup.logo && typeof startup.logo === "string"
                ? startup.logo
                : "/default-logo.png"
            }
            alt="Logo"
            className="startup-logo"
          />
          <div className="profile-info">
            <h1>{startup.name}</h1>
            <p>{startup.mission}</p>
          </div>

          <div className="profile-actions">
            <button className="follow-btn" onClick={toggleFollow}>
              {following ? "Following ✅" : "Follow +"}
            </button>
            {isFounder && (
              <button className="edit-btn" onClick={handleEditClick}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ========= Edit Modal ========= */}
        {editing && (
          <div className="edit-modal-overlay">
            <div className="edit-modal">
              <h2>Edit Startup Profile</h2>
              <label>Logo:</label>
              <input type="file" onChange={handleFileChange} />

              <label>Mission:</label>
              <textarea
                name="mission"
                value={formData.mission || ""}
                onChange={handleInputChange}
              />

              <label>Stage:</label>
              <input
                name="stage"
                value={formData.stage || ""}
                onChange={handleInputChange}
              />

              <label>Industries (comma separated):</label>
              <input
                name="industries"
                value={formData.industries?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industries: e.target.value.split(",").map((i) => i.trim()),
                  })
                }
              />

              <label>Funding Info:</label>
              <input
                name="fundingInfo"
                value={formData.fundingInfo || ""}
                onChange={handleInputChange}
              />

              <label>Skills (comma separated):</label>
              <input
                name="skills"
                value={formData.skills?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skills: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />

              <div className="edit-btns">
                <button className="save-btn" onClick={handleUpdate}>
                  💾 Save Changes
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setEditing(false)}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="info-section card">
          <h3>About Startup</h3>
          <p>
            <strong>Stage:</strong> {startup.stage}
          </p>
          <p>
            <strong>Industries:</strong> {startup.industries.join(", ")}
          </p>
          <p>
            <strong>Funding:</strong> {startup.fundingInfo || "N/A"}
          </p>
          <p>
            <strong>Skills:</strong> {startup.skills.join(", ")}
          </p>
          <p>
            <strong>Followers:</strong> {startup.followers?.length || 0}
          </p>
        </div>

        <div className="team-section card">
          <h3>Team Members 👥</h3>
          {startup.team?.length ? (
            <ul>
              {startup.team.map((m) => (
                <li key={m._id}>
                  {m.profileId?.name || "Unknown"} - {m.role}
                </li>
              ))}
            </ul>
          ) : (
            <p>No team members yet.</p>
          )}
        </div>

        <div className="posts-section card">
          <h3>Startup Updates 📢</h3>
          {startup.posts?.length ? (
            startup.posts.map((p) => (
              <div key={p._id} className="post-card">
                <p>{p.content}</p>
                {p.imageUrl && <img src={p.imageUrl} alt="post" />}
              </div>
            ))
          ) : (
            <p>No updates yet. Start sharing progress!</p>
          )}
        </div>
      </div>
    </div>
  );
}
