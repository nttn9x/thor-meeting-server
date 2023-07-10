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

// Connect Socket
io.on("connection", (socket) => {
  socket.on("room:join", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);

    const otherUsers = [];

    if (room) {
      room.forEach((id) => {
        otherUsers.push(id);
      });
    }

    console.log(`🚀 [Socket - room:join] id: ${socket.id} - roomId: ${roomId}`);

    socket.join(roomId);
    socket.emit("room:all-other-users", otherUsers);
  });

  socket.on("peer connection request", ({ userIdToCall, sdp }) => {
    io.to(userIdToCall).emit("peer:offer", { sdp, callerId: socket.id });
  });

  socket.on("peer:answer", ({ userToAnswerTo, sdp }) => {
    io.to(userToAnswerTo).emit("peer:answer", {
      sdp,
      answererId: socket.id,
    });
  });

  socket.on("peer:ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("peer:ice-candidate", { candidate, from: socket.id });
  });

  socket.on("disconnecting", () => {
    console.log("socket.rooms", socket.rooms);
    socket.rooms.forEach((room) => {
      socket.to(room).emit("user:leave", socket.id);
    });
  });
});
