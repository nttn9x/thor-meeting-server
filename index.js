const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

server.listen(3001, () => {
  console.log("Server is started 🚀 🚀 🚀");
});

app.get("/test", (req, res) => {
  res.json({ status: 200 });
});

const rooms = {};
// Connect Socket
io.on("connection", (socket) => {
  console.log(`[Socket - connection] We have a new id ${socket.id}`);

  const onJoining = (data) => {
    const { peerId, roomId } = data;

    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ peerId });

    console.log(
      `🚀 [Socket - room:joined] peerId: ${peerId} - roomId: ${roomId}`
    );

    io.to(roomId).emit("room:joined", {
      peerId,
      participants: rooms[roomId],
    });

    socket.on("disconnect", () => {
      console.log(`🚪 [Socket - disconnect] One friend is out ${peerId}`);

      rooms[roomId] = rooms[roomId].filter((p) => p.peerId !== peerId);

      io.to(roomId).emit("room:leave", peerId);
    });
  };

  /**
   * Listen to join event
   */
  socket.on("room:joining", onJoining);

  socket.on("socket:joining", () => {
    socket.emit("socket:connected");
  });
});
