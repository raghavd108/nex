// src/pages/StartupProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/StartupProfile.css";

export default function StartupProfile() {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);

  useEffect(() => {
    const fetchStartup = async () => {
      const res = await axios.get(
        `https://nex-pjq3.onrender.com/api/startups/${id}`
      );
      setStartup(res.data);
    };
    fetchStartup();
  }, [id]);

  if (!startup) return <p>Loading...</p>;

  return (
    <div className="startup-profile-page">
      <div className="banner"></div>
      <div className="profile-header">
        <img
          src={startup.logo || "/default-logo.png"}
          alt="Logo"
          className="startup-logo"
        />
        <div>
          <h1>{startup.name}</h1>
          <p>{startup.mission}</p>
        </div>
        <button className="follow-btn">Follow</button>
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
                {m.profileId.name} - {m.role}
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
