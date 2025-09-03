const Profile = require("../models/Profile");

let waitingUsers = [];
const userPeers = new Map();

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register-user", (userId) => {
      socket.userId = userId;
      console.log(`User ${userId} registered on socket ${socket.id}`);
    });

    socket.on("find-match", async (filter) => {
      try {
        socket.filter = filter;

        const matchSocket = waitingUsers.find((otherSocket) => {
          if (!otherSocket.filter || !filter) return false;

          const sameInterest = otherSocket.filter.interest === filter.interest;
          if (!sameInterest) return false;

          const a = filter;
          const b = otherSocket.filter;

          const bothAnywhere =
            a.locationType === "anywhere" && b.locationType === "anywhere";

          const oneNearbyOneAnywhere =
            (a.locationType === "anywhere" && b.locationType === "nearby") ||
            (a.locationType === "nearby" && b.locationType === "anywhere");

          const bothNearby =
            a.locationType === "nearby" && b.locationType === "nearby";

          const sameRegion = a.state === b.state && a.country === b.country;

          return (
            bothAnywhere ||
            (oneNearbyOneAnywhere && sameRegion) ||
            (bothNearby && sameRegion)
          );
        });

        if (matchSocket) {
          waitingUsers = waitingUsers.filter((s) => s.id !== matchSocket.id);

          const peerId = matchSocket.id;
          userPeers.set(socket.id, peerId);
          userPeers.set(peerId, socket.id);

          const peerProfile = await Profile.findOne({
            userId: matchSocket.userId,
          }).select("-__v -_id");

          const currentUserProfile = await Profile.findOne({
            userId: socket.userId,
          }).select("-__v -_id");

          if (peerProfile && currentUserProfile) {
            io.to(socket.id).emit("match-found", {
              peerId,
              profile: peerProfile,
            });
            io.to(peerId).emit("match-found", {
              peerId: socket.id,
              profile: currentUserProfile,
            });
          } else {
            io.to(socket.id).emit("match-found", {
              error: "Profile not found",
            });
            io.to(peerId).emit("match-found", { error: "Profile not found" });
          }
        } else {
          if (!waitingUsers.includes(socket)) {
            waitingUsers.push(socket);
          }
        }
      } catch (err) {
        console.error("Match error:", err.message);
        socket.emit("match-found", { error: "Server error during matching" });
      }
    });

    socket.on("offer", (offer) => {
      const peerId = userPeers.get(socket.id);
      if (peerId) io.to(peerId).emit("offer", offer);
    });

    socket.on("answer", (answer) => {
      const peerId = userPeers.get(socket.id);
      if (peerId) io.to(peerId).emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate) => {
      const peerId = userPeers.get(socket.id);
      if (peerId) io.to(peerId).emit("ice-candidate", candidate);
    });

    socket.on("like", async () => {
      const peerId = userPeers.get(socket.id);
      if (!peerId) return;

      const peerSocket = io.sockets.sockets.get(peerId);
      if (!peerSocket?.userId) return;

      try {
        const profile = await Profile.findOne({
          userId: peerSocket.userId,
        }).select("-__v -_id");

        if (profile) {
          socket.emit("peer-profile", {
            profile,
            peerSocketId: peerSocket.id,
          });
        } else {
          socket.emit("peer-profile", { error: "Profile not found" });
        }
      } catch (err) {
        console.error("Error fetching peer profile:", err.message);
        socket.emit("peer-profile", { error: "Internal error" });
      }
    });

    socket.on("skip", () => {
      const peerId = userPeers.get(socket.id);
      if (peerId) {
        io.to(peerId).emit("skip");
        io.to(socket.id).emit("skip");
        userPeers.delete(socket.id);
        userPeers.delete(peerId);
      }

      waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);

      if (!waitingUsers.includes(socket)) {
        waitingUsers.push(socket);
      }

      socket.emit("find-match", socket.filter);
    });

    socket.on("leave", () => {
      const peerId = userPeers.get(socket.id);
      if (peerId) {
        io.to(peerId).emit("skip");
        userPeers.delete(socket.id);
        userPeers.delete(peerId);
      }

      waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const peerId = userPeers.get(socket.id);
      if (peerId) {
        io.to(peerId).emit("skip");
        userPeers.delete(socket.id);
        userPeers.delete(peerId);
      }

      waitingUsers = waitingUsers.filter((s) => s.id !== socket.id);
    });
  });
};
