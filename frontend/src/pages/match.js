import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import "../css/MatchPage.css";
import { FiArrowLeft } from "react-icons/fi";

// 🔗 Connect socket (LIVE URL)
const socket = io("https://nex-pjq3.onrender.com", {
  transports: ["websocket"],
});

export default function LikedProfilesPage() {
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState({});
  const [chatActive, setChatActive] = useState(false); // ✅ mobile chat toggle

  const userId = localStorage.getItem("userId");

  // Fetch liked profiles
  useEffect(() => {
    const fetchLikedProfiles = async () => {
      try {
        const response = await axios.get(
          `https://nex-pjq3.onrender.com/api/likes/${userId}`
        );
        setLikedProfiles(response.data);
      } catch (err) {
        console.error("❌ Failed to fetch liked profiles", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchLikedProfiles();
  }, [userId]);

  // Socket setup
  useEffect(() => {
    if (!userId) return;

    socket.on("receiveMessage", (message) => {
      const otherUserId =
        message.fromUserId === userId ? message.toUserId : message.fromUserId;

      setMessages((prev) => ({
        ...prev,
        [otherUserId]: [...(prev[otherUserId] || []), message],
      }));

      if (!selectedProfile || selectedProfile.userId !== otherUserId) {
        setUnread((prev) => ({
          ...prev,
          [otherUserId]: (prev[otherUserId] || 0) + 1,
        }));
      }
    });

    socket.on("typing", ({ fromUserId }) => {
      if (selectedProfile && fromUserId === selectedProfile.userId) {
        setTyping(true);
      }
    });

    socket.on("stopTyping", ({ fromUserId }) => {
      if (selectedProfile && fromUserId === selectedProfile.userId) {
        setTyping(false);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [userId, selectedProfile]);

  // Open chat with profile
  const openChat = async (profile) => {
    setSelectedProfile(profile);
    setChatActive(true); // ✅ mobile chat active

    try {
      const res = await axios.get(
        `https://nex-pjq3.onrender.com/api/messages/${userId}/${profile.userId}`
      );

      if (res.data.length > 0) setConversationId(res.data[0].conversationId);
      else setConversationId(null);

      setMessages((prev) => ({
        ...prev,
        [profile.userId]: res.data,
      }));

      socket.emit("joinChat", { userId, otherUserId: profile.userId });
    } catch (err) {
      console.error("❌ Error loading chat history", err);
    }

    setUnread((prev) => {
      const copy = { ...prev };
      delete copy[profile.userId];
      return copy;
    });
  };

  // Close chat (mobile back button)
  const closeChat = () => {
    setChatActive(false);
    setSelectedProfile(null);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedProfile) return;

    const msg = {
      fromUserId: userId,
      toUserId: selectedProfile.userId,
      content: newMessage,
      conversationId: conversationId || undefined,
    };

    socket.emit("sendMessage", msg);
    setNewMessage("");
    socket.emit("stopTyping", { conversationId, fromUserId: userId });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (selectedProfile && conversationId) {
      if (e.target.value) {
        socket.emit("typing", { conversationId, fromUserId: userId });
      } else {
        socket.emit("stopTyping", { conversationId, fromUserId: userId });
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="match-page">
        {/* Left Sidebar */}
        <div className="profile-list-panel">
          <div className="liked-header">
            <h2>❤️ Liked Profiles</h2>
          </div>

          {loading ? (
            <p style={{ padding: "12px" }}>Loading...</p>
          ) : likedProfiles.length === 0 ? (
            <p style={{ padding: "12px" }}>You haven't liked anyone yet.</p>
          ) : (
            <div className="profile-list">
              {likedProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className={`profile-card ${
                    selectedProfile?._id === profile._id ? "active" : ""
                  }`}
                  onClick={() => openChat(profile)}
                >
                  <img
                    src={
                      profile.avatar?.startsWith("http")
                        ? profile.avatar
                        : `https://nex-pjq3.onrender.com${profile.avatar}`
                    }
                    alt="Profile"
                    className="avatar"
                  />
                  <div className="profile-info">
                    <h3>
                      {profile.name}{" "}
                      {unread[profile.userId] ? (
                        <span className="unread-badge">
                          {unread[profile.userId]}
                        </span>
                      ) : null}
                    </h3>
                    <p>{profile.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className={`details-panel ${chatActive ? "active" : ""}`}>
          {selectedProfile ? (
            <>
              <div className="profile-header">
                <button className="back-btn" onClick={closeChat}>
                  <FiArrowLeft size={22} /> {/* Proper back icon */}
                </button>
                <img
                  src={
                    profile.avatar?.startsWith("http")
                      ? profile.avatar
                      : `https://nex-pjq3.onrender.com${selectedProfile.avatar}`
                  }
                  alt="Profile"
                  className="avatar"
                />

                <h3>{selectedProfile.name}</h3>
              </div>

              <div className="chat-area">
                {(messages[selectedProfile.userId] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-bubble ${
                      msg.fromUserId === userId ? "user" : "other"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {typing && (
                  <div className="chat-bubble other typing">
                    {selectedProfile.name} is typing...
                  </div>
                )}
              </div>

              <div className="message-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>➤</button>
              </div>
            </>
          ) : (
            <div className="details-placeholder">
              Select a profile to start chatting
            </div>
          )}
        </div>
      </div>
    </>
  );
}
