const Profile = require("../models/Profile"); // make sure the path is correct

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // --- Join a room ---
    socket.on("join-room", async ({ roomId, userId }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;

      try {
        // Fetch user details from DB using userId field, not _id
        const profile = await Profile.findOne({ userId }).lean();
        const userData = {
          socketId: socket.id,
          userId,
          name: profile?.name || "Unknown",
          avatar: profile?.avatar || null,
          bio: profile?.bio || "",
        };

        console.log(`${userData.name} joined room ${roomId}`);

        // Notify others in the room with full details
        socket.to(roomId).emit("user-joined", userData);

        // Send list of existing users with details to the new user
        const clients = await io.in(roomId).fetchSockets();
        const otherUsers = [];

        for (let s of clients) {
          if (s.id !== socket.id) {
            const p = await Profile.findOne({ userId: s.userId }).lean();
            otherUsers.push({
              socketId: s.id,
              userId: s.userId,
              name: p?.name || "Unknown",
              avatar: p?.avatar || null,
              bio: p?.bio || "",
            });
          }
        }

        socket.emit("room-users", otherUsers);
      } catch (err) {
        console.error("Error fetching room users:", err);
      }
    });

    // --- Relay WebRTC offer ---
    socket.on("room-offer", ({ offer, targetSocketId }) => {
      io.to(targetSocketId).emit("room-offer", { offer, from: socket.id });
    });

    // --- Relay WebRTC answer ---
    socket.on("room-answer", ({ answer, targetSocketId }) => {
      io.to(targetSocketId).emit("room-answer", { answer, from: socket.id });
    });

    // --- Relay ICE candidate ---
    socket.on("room-ice-candidate", ({ candidate, targetSocketId }) => {
      io.to(targetSocketId).emit("room-ice-candidate", {
        candidate,
        from: socket.id,
      });
    });

    // --- End call / cut call ---
    socket.on("cut-call", () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("call-ended", { socketId: socket.id });
        console.log(`Call ended by: ${socket.userId} (${socket.id})`);
        socket.leave(socket.roomId);
        delete socket.roomId;
        if (socket.connected) {
          setTimeout(() => socket.disconnect(true), 100);
        }
      }
    });

    // --- Mute / unmute mic ---
    socket.on("toggle-mic", ({ isMuted }) => {
      if (socket.roomId) {
        socket
          .to(socket.roomId)
          .emit("peer-mic-toggled", { socketId: socket.id, isMuted });
        console.log(
          `User ${socket.userId} (${socket.id}) mic toggled: ${isMuted}`
        );
      }
    });

    // --- User leaves room manually ---
    socket.on("leave-room", () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("user-left", { socketId: socket.id });
        socket.leave(socket.roomId);
        delete socket.roomId;
        console.log(`User left room: ${socket.userId} (${socket.id})`);
      }
    });

    // --- Handle disconnect ---
    socket.on("disconnect", () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("user-left", { socketId: socket.id });
        console.log(
          `User disconnected from room: ${socket.userId} (${socket.id})`
        );
      } else {
        console.log(`User disconnected: ${socket.id}`);
      }
    });
  });
};
