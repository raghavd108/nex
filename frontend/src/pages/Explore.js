import React, { useState, useEffect } from "react";
import "../css/Explore.css";
import Navbar from "../components/Navbar";
import { FaPlus, FaHeart, FaComment, FaUsers, FaImage } from "react-icons/fa";
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
  const [selectedPost, setSelectedPost] = useState(null);

  // ✅ Added missing states
  const [roomImage, setRoomImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/rooms`);
      setPublicRooms(res.data || []);
      setFilteredRooms(res.data || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  // Fetch Posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const [userPosts, startupPosts] = await Promise.all([
        axios.get(`${API_BASE}/posts`),
        axios.get(`${API_BASE}/startupPosts`),
      ]);

      const allPosts = [
        ...(userPosts.data || []),
        ...(startupPosts.data || []),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

  // Filter Rooms
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

  // Join Room
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

  // Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreatingRoom(true);
    try {
      const formData = new FormData();
      formData.append("name", newRoom.name);
      formData.append("topic", newRoom.topic);
      formData.append("type", newRoom.type);
      if (roomImage) formData.append("image", roomImage);

      await axios.post(`${API_BASE}/rooms`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Room created successfully!");
      setShowCreateModal(false);
      setNewRoom({ name: "", topic: "", type: "public" });
      setRoomImage(null);
      setPreviewImage(null);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create room.");
    } finally {
      setCreatingRoom(false);
    }
  };

  // Like Post
  const handleLike = async (postId, isStartupPost = false) => {
    try {
      const endpoint = `${API_BASE}/${
        isStartupPost ? "startupPosts" : "posts"
      }/${postId}/like`;
      const res = await axios.put(endpoint, {}, { headers: getAuthHeaders() });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likes: res.data.likes ?? p.likes } : p
        )
      );
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost((sp) => ({ ...sp, likes: res.data.likes ?? sp.likes }));
      }
    } catch (err) {
      toast.error("Failed to like post");
    }
  };

  // Comment on Post
  const handleComment = async (postId, isStartupPost = false) => {
    const text = prompt("Write a comment:");
    if (!text || !text.trim()) return;
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
      if (selectedPost && selectedPost._id === postId)
        setSelectedPost(res.data);
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  // ✅ Image Preview for Create Room
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setRoomImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  return (
    <div className="explore-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />

      {/* Header */}
      <div className="explore-header">
        <h1 className="explore-title">🌍 Explore Nex</h1>

        <button
          className="create-btn"
          onClick={() => setShowCreateModal(true)}
          aria-label="Create room"
        >
          <FaPlus /> <span>Create Room</span>
        </button>
      </div>

      <div className="explore-wrapper">
        {/* Search */}
        <input
          type="search"
          className="room-search-input"
          placeholder="Search rooms by name or theme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Themed Rooms */}
        <h2 style={{ margin: "20px 10px 10px", fontWeight: 600 }}>
          🎨 Themed Rooms
        </h2>
        {filteredRooms.length > 0 ? (
          <div className="explore-grid">
            {filteredRooms.map((room) => (
              <div
                key={room._id}
                className="explore-tile"
                onClick={() => handleJoinRoom(room._id)}
              >
                <img
                  src={
                    room.image ||
                    "https://via.placeholder.com/400x400?text=Room+Image"
                  }
                  alt={room.name}
                  className="explore-image"
                />
                <div className="explore-overlay">
                  <div className="overlay-text">
                    <h3>{room.name}</h3>
                    <p>{room.topic}</p>
                    <div
                      className="post-actions"
                      style={{ justifyContent: "center", marginTop: 8 }}
                    >
                      <span>
                        <FaUsers /> {room.members?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-rooms">No themed rooms found.</p>
        )}

        {/* Latest Posts */}
        <h2 style={{ margin: "30px 10px 10px", fontWeight: 600 }}>
          🔥 Latest Posts
        </h2>

        {loading ? (
          <p className="loading-text">Loading posts...</p>
        ) : posts.length > 0 ? (
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
                    onClick={() => setSelectedPost(post)}
                  />
                  <div className="explore-overlay">
                    <div className="overlay-text">
                      <img src={avatar} alt="avatar" className="mini-avatar" />
                      <h4>{poster?.name || "User"}</h4>
                      <p>{post.content?.slice(0, 60)}...</p>
                      <div
                        className="post-actions"
                        style={{ justifyContent: "center", marginTop: 8 }}
                      >
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post._id, isStartupPost);
                          }}
                        >
                          <FaHeart /> {post.likes?.length || 0}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComment(post._id, isStartupPost);
                          }}
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
        ) : (
          <p className="no-rooms">No posts yet.</p>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create a Room</h2>
            <form onSubmit={handleCreateRoom} encType="multipart/form-data">
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

              {/* Image Upload */}
              <label className="upload-label">
                <FaImage /> Upload Room Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              {previewImage && (
                <div className="image-preview">
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{
                      width: "100%",
                      maxHeight: 200,
                      borderRadius: 10,
                      marginTop: 10,
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

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

      {/* Full Post Modal */}
      {selectedPost && (
        <div
          className="post-modal-overlay"
          onClick={() => setSelectedPost(null)}
        >
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-modal-left">
              <img
                src={
                  selectedPost.imageUrl ||
                  "https://via.placeholder.com/900x900?text=No+Image"
                }
                alt="Post"
              />
            </div>

            <div className="post-modal-right">
              <div className="post-header">
                <img
                  className="post-avatar"
                  src={
                    selectedPost.startupId
                      ? selectedPost.startupId?.logo
                      : selectedPost.userId?.avatar || "/default-avatar.png"
                  }
                  alt="avatar"
                />
                <h4>
                  {selectedPost.startupId
                    ? selectedPost.startupId.name
                    : selectedPost.userId?.name || "User"}
                </h4>
              </div>

              <div className="post-content">
                <p>{selectedPost.content}</p>
              </div>

              <div className="post-actions-modal">
                <span
                  onClick={() =>
                    handleLike(selectedPost._id, !!selectedPost.startupId)
                  }
                >
                  <FaHeart /> {selectedPost.likes?.length || 0}
                </span>
                <span
                  onClick={() =>
                    handleComment(selectedPost._id, !!selectedPost.startupId)
                  }
                >
                  <FaComment /> {selectedPost.comments?.length || 0}
                </span>
              </div>

              <div className="post-comments">
                {selectedPost.comments?.length > 0 ? (
                  selectedPost.comments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <strong>
                        {c.user?.name || c.userId?.name || "User"}:
                      </strong>{" "}
                      {c.text}
                    </div>
                  ))
                ) : (
                  <p className="no-comments">No comments yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
