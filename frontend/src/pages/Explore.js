import React, { useState, useEffect } from "react";
import "../css/Explore.css";
import Navbar from "../components/Navbar";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Explore() {
  const [publicRooms, setPublicRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [newRoom, setNewRoom] = useState({
    name: "",
    topic: "",
    type: "public",
  });

  const navigate = useNavigate();
  const API_BASE = "https://nex-pjq3.onrender.com/api/rooms";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE);
      setPublicRooms(res.data);
      setFilteredRooms(res.data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      toast.error("Failed to fetch public rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    setFilteredRooms(
      term
        ? publicRooms.filter(
            (room) =>
              room.name.toLowerCase().includes(term) ||
              (room.topic && room.topic.toLowerCase().includes(term))
          )
        : publicRooms
    );
  }, [searchTerm, publicRooms]);

  const handleJoinRoom = async (roomId) => {
    try {
      setJoiningRoomId(roomId);
      await axios.post(
        `${API_BASE}/${roomId}/join`,
        {},
        { headers: getAuthHeaders() }
      );
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error("Failed to join room:", err);
      toast.error(err.response?.data?.message || "Unable to join the room.");
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreatingRoom(true);
    try {
      await axios.post(API_BASE, newRoom, { headers: getAuthHeaders() });
      toast.success("Room created successfully!");
      setShowCreateModal(false);
      setNewRoom({ name: "", topic: "", type: "public" });
      fetchRooms();
    } catch (err) {
      console.error("Failed to create room:", err);
      toast.error(err.response?.data?.message || "Unable to create the room.");
    } finally {
      setCreatingRoom(false);
    }
  };

  return (
    <div className="explore-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      <div className="explore-header">
        <h1 className="explore-title">🔍 Explore Nex</h1>
        <div className="header-actions">
          <button
            className="create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus /> <span>Create Room</span>
          </button>
        </div>
      </div>

      <div className="explore-wrapper">
        <section className="explore-section">
          <input
            type="search"
            className="room-search-input"
            placeholder="Search rooms by name or theme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />

          {loading ? (
            <p className="loading-text">Loading public rooms...</p>
          ) : filteredRooms.length === 0 ? (
            <p className="no-rooms">No public rooms found.</p>
          ) : (
            <div className="explore-grid">
              {filteredRooms.map((room) => (
                <div
                  key={room._id}
                  className="explore-tile"
                  onClick={() => handleJoinRoom(room._id)}
                >
                  <img
                    src={
                      room.createdBy?.avatar ||
                      "https://via.placeholder.com/300x300?text=Nex+Room"
                    }
                    alt={room.name}
                    className="explore-image"
                  />
                  <div className="explore-overlay">
                    <div className="overlay-text">
                      <h3>{room.name}</h3>
                      <p>{room.topic}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create a Themed Room</h2>
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                placeholder="Room Name"
                value={newRoom.name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, name: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Theme / Topic"
                value={newRoom.topic}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, topic: e.target.value })
                }
                required
              />
              <select
                value={newRoom.type}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, type: e.target.value })
                }
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="create-btn"
                  disabled={creatingRoom}
                >
                  {creatingRoom ? "Creating..." : "✅ Create"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingRoom}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
