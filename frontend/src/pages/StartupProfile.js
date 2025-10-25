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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com/api";

  // =================== Fetch Startup Data ===================
  useEffect(() => {
    const fetchStartup = async () => {
      if (!token) {
        alert("You must be logged in to view this startup.");
        return;
      }
      try {
        const [startupRes, profileRes] = await Promise.all([
          axios.get(`${API_URL}/startups/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const startupData = startupRes.data;
        const myProfileId = profileRes.data._id;

        setStartup(startupData);
        setFormData({
          name: startupData.name,
          mission: startupData.mission,
          description: startupData.description,
          stage: startupData.stage,
          fundingInfo: startupData.fundingInfo,
          industries: startupData.industries || [],
          skills: startupData.skills || [],
          logo: startupData.logo || "",
        });

        setFollowing(startupData.followers?.some((f) => f._id === myProfileId));
        setIsFounder(
          startupData.founderProfileId === myProfileId ||
            startupData.founderProfileId?._id === myProfileId
        );
      } catch (err) {
        console.error("Failed to fetch startup:", err);
        alert("Error fetching startup data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStartup();
  }, [id, token]);

  // =================== Follow / Unfollow ===================
  const toggleFollow = async () => {
    try {
      await axios.post(
        `${API_URL}/startups/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowing((prev) => !prev);
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
      alert("Error updating follow status");
    }
  };

  // =================== Edit & Update ===================
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

      const res = await axios.put(`${API_URL}/startups/${id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setStartup(res.data);
      setEditing(false);
      alert("✅ Startup updated successfully!");
    } catch (err) {
      console.error("Error updating startup:", err);
      alert("Failed to update startup.");
    }
  };

  // =================== Search Team Members ===================
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) return setSearchResults([]);

    try {
      const res = await axios.get(`${API_URL}/profile/search`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      // ✅ Filter out duplicates (avoid adding same user twice)
      const results = Array.isArray(res.data)
        ? res.data.filter(
            (u) => !startup.team.some((m) => m.profileId?._id === u._id)
          )
        : [];
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    }
  };

  const handleSelectMember = (user) => {
    if (selectedMembers.some((m) => m._id === user._id)) return;
    setSelectedMembers((prev) => [...prev, { ...user, role: "" }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRoleChange = (id, value) => {
    setSelectedMembers((prev) =>
      prev.map((m) => (m._id === id ? { ...m, role: value } : m))
    );
  };

  const handleRemoveMember = (id) => {
    setSelectedMembers((prev) => prev.filter((m) => m._id !== id));
  };

  const handleSaveTeam = async () => {
    if (selectedMembers.length === 0) return alert("Add at least one teammate");

    try {
      await Promise.all(
        selectedMembers.map((m) =>
          axios.post(
            `${API_URL}/startups/${id}/addTeamMember`,
            { profileId: m._id, role: m.role || "Member" },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      alert("🎉 Team members added successfully!");
      setStartup((prev) => ({
        ...prev,
        team: [
          ...prev.team,
          ...selectedMembers.map((m) => ({
            profileId: m,
            role: m.role || "Member",
          })),
        ],
      }));

      setSelectedMembers([]);
    } catch (err) {
      console.error("Add members failed:", err);
      alert("Failed to add team members");
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
              typeof startup.logo === "string" && startup.logo
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
                ✏️ Edit
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

        {/* ========= Info Section ========= */}
        <div className="info-section card">
          <h3>About Startup</h3>
          <p>
            <strong>Stage:</strong> {startup.stage}
          </p>
          <p>
            <strong>Industries:</strong> {startup.industries?.join(", ")}
          </p>
          <p>
            <strong>Funding:</strong> {startup.fundingInfo || "N/A"}
          </p>
          <p>
            <strong>Skills:</strong> {startup.skills?.join(", ")}
          </p>
          <p>
            <strong>Followers:</strong> {startup.followers?.length || 0}
          </p>
        </div>

        {/* ========= Team Section ========= */}
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

          {/* ========= Add Team Members ========= */}
          {isFounder && (
            <div className="add-member-box">
              <h4>Add Team Members</h4>
              <input
                type="text"
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={handleSearch}
              />

              {searchResults.length > 0 && (
                <div className="search-results-container">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="profile-preview"
                      onClick={() => handleSelectMember(user)}
                    >
                      <img
                        src={user.avatar || "/default-avatar.png"}
                        alt={user.username}
                      />
                      <div className="profile-info">
                        <span className="name">{user.name || "Unnamed"}</span>
                        <span className="username">@{user.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedMembers.length > 0 && (
                <div className="selected-members">
                  <h5>Selected Members</h5>
                  {selectedMembers.map((m) => (
                    <div key={m._id} className="selected-member">
                      <img
                        src={m.avatar || "/default-avatar.png"}
                        alt={m.name}
                        className="avatar"
                      />
                      <span>{m.name}</span>
                      <input
                        type="text"
                        placeholder="Role (e.g., Designer)"
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(m._id, e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleRemoveMember(m._id)}
                        style={{
                          marginLeft: "8px",
                          color: "red",
                          cursor: "pointer",
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button className="save-btn" onClick={handleSaveTeam}>
                    💾 Save Team
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
