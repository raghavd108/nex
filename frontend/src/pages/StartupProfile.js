import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function StartupProfile() {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await axios.get(`/api/startups/${id}`);
        setStartup(res.data);

        // check if user is following
        const profileRes = await axios.get("/api/profile/me");
        const myProfileId = profileRes.data._id;
        setFollowing(res.data.followers.some((f) => f._id === myProfileId));
      } catch (err) {
        console.error(err);
      }
    };
    fetchStartup();
  }, [id]);

  const toggleFollow = async () => {
    try {
      await axios.post(`/api/startups/${id}/follow`);
      setFollowing(!following);
    } catch (err) {
      console.error(err);
    }
  };

  if (!startup) return <p>Loading...</p>;

  return (
    <div className="startup-profile">
      <img src={startup.logo || "/default-logo.png"} alt="Logo" width="150" />
      <h2>{startup.name}</h2>
      <p>
        <strong>Mission:</strong> {startup.mission}
      </p>
      {startup.description && (
        <p>
          <strong>Description:</strong> {startup.description}
        </p>
      )}
      <p>
        <strong>Stage:</strong> {startup.stage}
      </p>
      {startup.fundingInfo && (
        <p>
          <strong>Funding:</strong> {startup.fundingInfo}
        </p>
      )}
      <p>
        <strong>Roles:</strong> {startup.roles.join(", ")}
      </p>
      <p>
        <strong>Industries:</strong> {startup.industries.join(", ")}
      </p>
      <p>
        <strong>Skills:</strong> {startup.skills.join(", ")}
      </p>

      {startup.pitchDeckUrl && (
        <p>
          <a
            href={startup.pitchDeckUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Pitch Deck
          </a>
        </p>
      )}

      <h3>Founder</h3>
      {startup.founderProfileId && (
        <p>
          {startup.founderProfileId.name} (@{startup.founderProfileId.username})
        </p>
      )}

      <h3>Team Members</h3>
      <ul>
        {startup.team.map((m) => (
          <li key={m.profileId._id}>
            {m.profileId.name} - {m.role}
          </li>
        ))}
      </ul>

      <button onClick={toggleFollow}>
        {following ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
}
