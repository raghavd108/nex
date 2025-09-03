import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Mic, MicOff, PhoneOff } from "lucide-react"; // modern icons
import "../css/VideoRoom.css";

// Function to create new socket
const createSocket = () =>
  io("https://nex-pjq3.onrender.com", { autoConnect: true });

// STUN server
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoRoom({ roomId }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const localVideoRef = useRef();
  const localStream = useRef(null);
  const peerConnections = useRef({});
  const [peers, setPeers] = useState([]);
  const [micMuted, setMicMuted] = useState(false);
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socketRef.current = createSocket();
    const socket = socketRef.current;
    let isMounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!isMounted) return;

        localVideoRef.current.srcObject = stream;
        localStream.current = stream;

        socket.emit("join-room", { roomId, userId });

        // --- Existing users ---
        socket.on("room-users", (users) => {
          users.forEach((user) => {
            createPeerConnection(user.socketId, stream, false, socket);
            setPeers((prev) => [
              ...prev.filter((p) => p.socketId !== user.socketId),
              { ...user, stream: null }, // add metadata now, attach stream later
            ]);
          });
        });

        // --- New user joined ---
        socket.on("user-joined", (user) => {
          createPeerConnection(user.socketId, stream, true, socket);
          setPeers((prev) => [
            ...prev.filter((p) => p.socketId !== user.socketId),
            { ...user, stream: null },
          ]);
          showNotification(`${user.name} joined the room 🎉`);
        });

        // --- Handle offer ---
        socket.on("room-offer", async ({ offer, from }) => {
          const pcObj = createPeerConnection(from, stream, false, socket);
          await pcObj.pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pcObj.pc.createAnswer();
          await pcObj.pc.setLocalDescription(answer);
          socket.emit("room-answer", { answer, targetSocketId: from });

          pcObj.queuedCandidates.forEach(
            async (c) => await pcObj.pc.addIceCandidate(new RTCIceCandidate(c))
          );
          pcObj.queuedCandidates = [];
        });

        // --- Handle answer ---
        socket.on("room-answer", async ({ answer, from }) => {
          const pcObj = peerConnections.current[from];
          if (pcObj && pcObj.pc.signalingState === "have-local-offer") {
            await pcObj.pc.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
            pcObj.queuedCandidates.forEach(
              async (c) =>
                await pcObj.pc.addIceCandidate(new RTCIceCandidate(c))
            );
            pcObj.queuedCandidates = [];
          }
        });

        // --- Handle ICE ---
        socket.on("room-ice-candidate", ({ candidate, from }) => {
          const pcObj = peerConnections.current[from];
          if (!pcObj) return;
          if (pcObj.pc.remoteDescription) {
            pcObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pcObj.queuedCandidates.push(candidate);
          }
        });

        // --- Handle peer leaving ---
        socket.on("user-left", ({ socketId }) => {
          const pcObj = peerConnections.current[socketId];
          if (pcObj) pcObj.pc.close();
          delete peerConnections.current[socketId];
          setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
          showNotification("A user left the room 👋");
        });

        // --- Handle call end ---
        socket.on("call-ended", ({ socketId }) => {
          const pcObj = peerConnections.current[socketId];
          if (pcObj) pcObj.pc.close();
          delete peerConnections.current[socketId];
          setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
          showNotification("The call has ended ❌");
        });
      } catch (err) {
        console.error("Media error:", err);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.emit("leave-room");
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      Object.values(peerConnections.current).forEach(({ pc }) => pc.close());
      peerConnections.current = {};
      setPeers([]);

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
    };
  }, [roomId, userId]);

  const createPeerConnection = (socketId, stream, isOffer, socket) => {
    if (peerConnections.current[socketId])
      return peerConnections.current[socketId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const queuedCandidates = [];

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === socketId ? { ...p, stream: event.streams[0] } : p
        )
      );
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("room-ice-candidate", {
          candidate: event.candidate,
          targetSocketId: socketId,
        });
      }
    };

    peerConnections.current[socketId] = { pc, queuedCandidates };

    if (isOffer) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() =>
          socket.emit("room-offer", {
            offer: pc.localDescription,
            targetSocketId: socketId,
          })
        )
        .catch(console.error);
    }

    return peerConnections.current[socketId];
  };

  const handleCutCall = () => {
    if (socketRef.current) {
      socketRef.current.emit("cut-call");
      socketRef.current.disconnect();
    }
    Object.values(peerConnections.current).forEach(({ pc }) => pc.close());
    peerConnections.current = {};
    setPeers([]);

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    navigate("/explore");
  };

  const handleToggleMic = () => {
    if (!localStream.current) return;
    localStream.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicMuted((prev) => !prev);
  };

  const showNotification = (msg) => {
    setNotifications((prev) => [...prev, msg]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 3000);
  };

  return (
    <div className="video-room">
      <h1>🎥 Themed Room</h1>
      {/* Notifications */}
      <div className="notifications">
        {notifications.map((n, idx) => (
          <div key={idx} className="notification">
            {n}
          </div>
        ))}
      </div>

      <main className="video-grid">
        <div className="video-wrapper local">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-player"
          />
          <span className="video-label">You</span>
        </div>

        {peers.map((peer) => (
          <div key={peer.socketId} className="video-wrapper remote">
            <video
              autoPlay
              playsInline
              className="video-player"
              ref={(v) => v && peer.stream && (v.srcObject = peer.stream)}
            />
            <span className="video-label">{peer.name || "Guest"}</span>
          </div>
        ))}
      </main>

      <footer className="video-controls">
        <button onClick={handleToggleMic} className="control-btn">
          {micMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button onClick={handleCutCall} className="control-btn end">
          <PhoneOff size={22} />
        </button>
      </footer>
    </div>
  );
}
