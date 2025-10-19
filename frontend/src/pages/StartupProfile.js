// src/pages/StartupProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/StartupProfile.css";

export default function StartupProfile() {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const API_URL = "https://nex-pjq3.onrender.com/api";

  useEffect(() => {
    const fetchStartup = async () => {
      if (!token) {
        alert("You must be logged in to view this startup.");
        return;
      }
      try {
        // ✅ Fetch startup data
        const res = await axios.get(`${API_URL}/startups/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStartup(res.data);

        // ✅ Check if current user is following
        const profileRes = await axios.get(`${API_URL}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myProfileId = profileRes.data._id;
        setFollowing(res.data.followers?.some((f) => f._id === myProfileId));
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

  if (loading) return <p>Loading...</p>;
  if (!startup) return <p>Startup not found.</p>;

  return (
    <div className="startup-profile-page">
      <div className="banner"></div>

      <div className="profile-header">
        <img
          src={startup.logo || "/default-logo.png"}
          alt="Logo"
          className="startup-logo"
        />
        <div className="profile-info">
          <h1>{startup.name}</h1>
          <p>{startup.mission}</p>
        </div>
        <button className="follow-btn" onClick={toggleFollow}>
          {following ? "Following ✅" : "Follow +"}
        </button>
      </div>

      <div className="info-section">
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
      </div>

      <div className="team-section">
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

      <div className="posts-section">
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
  );
}
