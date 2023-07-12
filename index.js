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

const device = {};

// Connect Socket
io.on("connection", (socket) => {
  socket.data = socket.handshake.query;

  device[socket.id] = {
    video: socket.data.video,
  };

  socket.on("room:join", async (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const sockets = await io.in(roomId).fetchSockets();

    const otherUsers = [];

    if (room) {
      room.forEach((id) => {
        const s = sockets.find((s) => {
          return s.id === id;
        });

        otherUsers.push({
          id,
          data: {
            ...(s?.data || {}),
            video: device[id]?.video,
          },
        });
      });
    }
    console.log(`🚀 [Socket - room:join] id: ${socket.id} - roomId: ${roomId}`);

    socket.join(roomId);
    socket.emit("room:all-other-users", otherUsers);
  });

  socket.on("peer:request", ({ userIdToCall, sdp }) => {
    io.to(userIdToCall).emit("peer:offer", {
      sdp,
      callerId: socket.id,
      data: socket?.data || {},
    });
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

  socket.on("peer:hide-video", ({ id, roomId }) => {
    device[id] = { video: false };
    socket.to(roomId).emit("peer:hide-video", id);
  });

  socket.on("peer:show-video", ({ id, roomId }) => {
    device[id] = { video: true };
    socket.to(roomId).emit("peer:show-video", id);
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("peer:leave", socket.id);
    });
  });
});
