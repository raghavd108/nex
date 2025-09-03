import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/VideoCall.css";
import axios from "axios";
import CallFilterPrompt from "../pages/CallFilterPrompt";
import Lottie from "lottie-react";
import searchingAnimation from "../assets/lottie/searching.json";
import { PhoneOff, SkipForward, Heart } from "lucide-react";

const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

const socket = io("https://nex-pjq3.onrender.com", {
  auth: { token },
  autoConnect: false,
});

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoCall() {
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  const [callStarted, setCallStarted] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState(null);
  const [showFilterPrompt, setShowFilterPrompt] = useState(true);
  const [filterData, setFilterData] = useState(null);
  const [localReady, setLocalReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const resetPeerConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const fetchLocationInfo = async (lat, lon) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await response.json();
    const address = data.address || {};
    return {
      country: address.country || null,
      state: address.state || null,
    };
  };

  const sendFilter = useCallback(async (data) => {
    setIsSearching(true);

    if (data.matchMode === "nearby") {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const { state, country } = await fetchLocationInfo(
              latitude,
              longitude
            );
            socket.emit("find-match", {
              ...data,
              state,
              country,
              locationType: "nearby",
            });
          } catch (err) {
            toast.error("Could not detect region. Try again.");
            setIsSearching(false);
          }
        },
        (error) => {
          toast.error("Location access denied. Please enable it.");
          console.error("Geolocation error:", error);
          setIsSearching(false);
        }
      );
    } else {
      socket.emit("find-match", {
        ...data,
        locationType: "anywhere",
      });
    }
  }, []);

  const setupConnection = useCallback(async (isCaller) => {
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalReady(true);
    }

    peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStreamRef.current);
    });

    peerConnection.current.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    if (isCaller) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("offer", offer);
    }
  }, []);

  const startCallWithFilters = async (data) => {
    setFilterData(data);
    setShowFilterPrompt(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalReady(true);

      await socket.connect();
      setCallStarted(true);
      socket.emit("register-user", userId);

      await sendFilter(data);
    } catch (err) {
      console.error("Connection or media error:", err);
      toast.error("Please allow camera/mic and ensure you're logged in.");
    }
  };

  const endCall = () => {
    // Close peer connection
    if (peerConnection.current) peerConnection.current.close();
    peerConnection.current = null;

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Reset video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Reset states
    setCallStarted(false);
    setMatchedUserId(null);
    setShowFilterPrompt(true);
    setIsSearching(false);

    // Tell backend to leave and disconnect socket
    socket.emit("leave");
    if (socket.connected) socket.disconnect();
  };

  const handleSkip = useCallback(() => {
    resetPeerConnection();
    setMatchedUserId(null);
    socket.emit("leave");

    if (!filterData) return;
    sendFilter(filterData);
  }, [filterData, sendFilter]);

  const handleLike = async () => {
    if (matchedUserId && userId) {
      try {
        socket.emit("like", { fromUserId: userId, toUserId: matchedUserId });

        const response = await axios.post(
          "http://localhost:5001/api/likes/like",
          { fromUserId: userId, toUserId: matchedUserId }
        );

        toast.success("❤️ You liked this user!");
        console.log("✅ Like saved:", response.data);
      } catch (error) {
        console.error("❌ Error saving like:", error);
        toast.error("Error saving like. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localReady]);

  useEffect(() => {
    const handleMatch = async ({ peerId, profile }) => {
      setMatchedUserId(profile.userId);
      toast.success(`🎉 You matched with ${profile.name}`);
      setIsSearching(false);
      const isCaller = socket.id > peerId;
      await setupConnection(isCaller);
    };

    socket.on("match-found", handleMatch);

    socket.on("offer", async (offer) => {
      await setupConnection(false);
      if (
        peerConnection.current.signalingState === "stable" ||
        peerConnection.current.signalingState === "have-remote-offer"
      ) {
        await peerConnection.current.setRemoteDescription(offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", answer);
      }
    });

    socket.on("answer", async (answer) => {
      if (peerConnection.current.signalingState === "have-local-offer") {
        await peerConnection.current.setRemoteDescription(answer);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(candidate);
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("skip", () => {
      toast.info("The other user skipped. Finding someone else...");
      handleSkip();
    });

    socket.on("peer-profile", (data) => {
      if (data?.profile) {
        toast.info("👍 You matched and liked!");
        console.log("✅ Received peer profile after like:", data.profile);
      }
    });

    return () => {
      socket.off("match-found", handleMatch);
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("skip");
      socket.off("peer-profile");
    };
  }, [setupConnection, handleSkip, navigate]);

  const handleSwipe = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchStartY = e.currentTarget.dataset.touchstart;
    if (touchStartY - touchEndY > 50) {
      handleSkip();
    }
  };

  return (
    <div className="video-reel-wrapper">
      <ToastContainer position="top-center" autoClose={3000} />
      {showFilterPrompt ? (
        <CallFilterPrompt onSubmit={startCallWithFilters} />
      ) : callStarted ? (
        <div
          className="video-reel-container"
          onTouchStart={(e) =>
            (e.currentTarget.dataset.touchstart = e.touches[0].clientY)
          }
          onTouchEnd={handleSwipe}
        >
          {isSearching && (
            <div className="searching-overlay">
              <Lottie
                animationData={searchingAnimation}
                loop
                style={{ width: 150, height: 150 }}
              />
              <p>Searching for a match...</p>
            </div>
          )}

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-reel remote"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-reel local"
          />
          <div className="controls">
            <button onClick={endCall} className="join-btn danger">
              <PhoneOff className="icon" />
              <span className="btn-text">Stop</span>
            </button>
            <button onClick={handleSkip} className="join-btn skip">
              <SkipForward className="icon" />
              <span className="btn-text">Skip</span>
            </button>
            <button onClick={handleLike} className="join-btn like">
              <Heart className="icon" />
              <span className="btn-text">Like</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
