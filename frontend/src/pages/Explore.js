import React, { useState, useEffect } from "react";
import "../css/Explore.css";
import Navbar from "../components/Navbar";
import { FaPlus, FaHeart, FaComment } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Explore() {
  const [publicRooms, setPublicRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For image preview modal

  const [newRoom, setNewRoom] = useState({
    name: "",
    topic: "",
    type: "public",
  });

  const navigate = useNavigate();
  const API_BASE = "https://nex-pjq3.onrender.com/api";
  const token = localStorage.getItem("token");

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ✅ Fetch Rooms
  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/rooms`);
      setPublicRooms(res.data);
      setFilteredRooms(res.data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  // ✅ Fetch posts from both users & startups
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const [userPosts, startupPosts] = await Promise.all([
        axios.get(`${API_BASE}/posts`),
        axios.get(`${API_BASE}/startupPosts`),
      ]);

      const allPosts = [...userPosts.data, ...startupPosts.data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPosts(allPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchPosts();
  }, []);

  // ✅ Search filter for rooms
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

  // ✅ Join Room
  const handleJoinRoom = async (roomId) => {
    try {
      setJoiningRoomId(roomId);
      await axios.post(
        `${API_BASE}/rooms/${roomId}/join`,
        {},
        { headers: getAuthHeaders() }
      );
      navigate(`/room/${roomId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to join the room.");
    } finally {
      setJoiningRoomId(null);
    }
  };

  // ✅ Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreatingRoom(true);
    try {
      await axios.post(`${API_BASE}/rooms`, newRoom, {
        headers: getAuthHeaders(),
      });
      toast.success("Room created successfully!");
      setShowCreateModal(false);
      setNewRoom({ name: "", topic: "", type: "public" });
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create room.");
    } finally {
      setCreatingRoom(false);
    }
  };

  // ✅ Like post
  const handleLike = async (postId, isStartupPost = false) => {
    try {
      const endpoint = `${API_BASE}/${
        isStartupPost ? "startupPosts" : "posts"
      }/${postId}/like`;
      const res = await axios.put(endpoint, {}, { headers: getAuthHeaders() });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likes: res.data.likes || [] } : p
        )
      );
    } catch (err) {
      toast.error("Failed to like post");
    }
  };

  // ✅ Comment on post
  const handleComment = async (postId, isStartupPost = false) => {
    const text = prompt("Write a comment:");
    if (!text.trim()) return;

    try {
      const endpoint = `${API_BASE}/${
        isStartupPost ? "startupPosts" : "posts"
      }/${postId}/comment`;
      const res = await axios.post(
        endpoint,
        { text },
        { headers: getAuthHeaders() }
      );
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  return (
    <div className="explore-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      <div className="explore-header">
        <h1 className="explore-title">🌍 Explore Nex</h1>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          <FaPlus /> Create Room
        </button>
      </div>

      {/* Search */}
      <div className="explore-wrapper">
        <input
          type="search"
          className="room-search-input"
          placeholder="Search rooms by name or theme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading ? (
          <p className="loading-text">Loading content...</p>
        ) : (
          <>
            {/* 🌟 Explore Feed Section */}
            <div className="explore-grid">
              {posts.map((post) => {
                const isStartupPost = !!post.startupId;
                const poster = isStartupPost ? post.startupId : post.userId;
                const avatar = isStartupPost
                  ? poster?.logo
                  : poster?.avatar || "/default-avatar.png";

                return (
                  <div key={post._id} className="explore-tile post-tile">
                    <img
                      src={
                        post.imageUrl ||
                        "https://via.placeholder.com/400x400?text=No+Image"
                      }
                      alt="Post"
                      className="explore-image"
                      onClick={() => setSelectedImage(post.imageUrl)}
                    />
                    <div className="explore-overlay">
                      <div className="overlay-text">
                        <img
                          src={avatar}
                          alt="avatar"
                          className="mini-avatar"
                        />
                        <h4>{poster?.name || "User"}</h4>
                        <p>{post.content?.slice(0, 60)}...</p>
                        <div className="post-actions">
                          <span
                            onClick={() => handleLike(post._id, isStartupPost)}
                          >
                            <FaHeart /> {post.likes?.length || 0}
                          </span>
                          <span
                            onClick={() =>
                              handleComment(post._id, isStartupPost)
                            }
                          >
                            <FaComment /> {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 🏗️ Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create a Room</h2>
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
                  {creatingRoom ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🖼️ Image Lightbox */}
      {selectedImage && (
        <div className="image-lightbox" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Full View" className="lightbox-img" />
        </div>
      )}
    </div>
  );
}
