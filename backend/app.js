const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const profileRoutes = require("./routes/profileRoutes");
const videoCallSocketHandler = require("./routes/video-call.js");
const likeRoutes = require("./routes/likeRoutes");
const path = require("path");
const settingsRoutes = require("./routes/settings");
const roomRoutes = require("./routes/roomRoutes");
const themedRoom = require("./routes/themedRoom");
const messageRoutes = require("./routes/messages");
const chatSocket = require("./routes/messageSocket.js");

require("dotenv").config(); // Load .env variables

const app = express();
const server = http.createServer(app);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Setup Socket.IO server (changed)
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"], // frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const _dirname = path.resolve();

// ✅ Use default namespace (no custom .of("/classic"))
videoCallSocketHandler(io);
themedRoom(io);
chatSocket(io);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Video call signaling server running 🚀");
});

app.use("/api/profile", profileRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use(express.static(path.join(_dirname, "/frontend/build")));
app.get(/.*/, (_, res) => {
  res.sendFile(path.resolve(_dirname, "frontend", "build", "index.html"));
});

// ✅ Example API Route
app.use("/api/auth", require("./routes/auth"));

// ✅ MongoDB + Server Start
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5001;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));
