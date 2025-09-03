const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // User joins a conversation room
    socket.on("joinChat", async ({ userId, otherUserId }) => {
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, otherUserId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, otherUserId],
        });
        await conversation.save();
      }

      socket.join(conversation._id.toString());
      console.log(`User ${userId} joined conversation ${conversation._id}`);
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ fromUserId, toUserId, content }) => {
      try {
        let conversation = await Conversation.findOne({
          participants: { $all: [fromUserId, toUserId] },
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [fromUserId, toUserId],
          });
          await conversation.save();
        }

        const newMessage = new Message({
          conversationId: conversation._id,
          fromUserId,
          toUserId,
          content,
        });

        await newMessage.save();

        // Emit to everyone in the conversation room
        io.to(conversation._id.toString()).emit("receiveMessage", newMessage);
      } catch (err) {
        console.error("❌ Error saving message:", err);
      }
    });

    // Typing indicators
    socket.on("typing", ({ conversationId, fromUserId }) => {
      io.to(conversationId).emit("typing", { fromUserId });
    });

    socket.on("stopTyping", ({ conversationId, fromUserId }) => {
      io.to(conversationId).emit("stopTyping", { fromUserId });
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};
