import Room from "../models/Room.js";
import Message from "../models/Message.js";

// Handler expects (io, redisClient) where redisClient may be null (fallback to in-memory)
export const redisSocketHandler = async (io, redisClient) => {
  // In-memory fallback store (only used if redisClient is falsy)
  const roomsMap = new Map();

  const addParticipant = async (roomCode, socketId, user) => {
    const payload = { socketId, userId: user.id, name: user.name, joinedAt: new Date().toISOString() };
    if (redisClient) {
      await redisClient.hSet(`room:${roomCode}`, socketId, JSON.stringify(payload));
      await redisClient.set(`socket:${socketId}`, roomCode, { EX: 60 * 60 * 24 });
    } else {
      if (!roomsMap.has(roomCode)) roomsMap.set(roomCode, {});
      roomsMap.get(roomCode)[socketId] = payload;
    }
  };

  const removeParticipant = async (roomCode, socketId) => {
    if (redisClient) {
      await redisClient.hDel(`room:${roomCode}`, socketId);
      await redisClient.del(`socket:${socketId}`);
      const len = await redisClient.hLen(`room:${roomCode}`);
      if (len === 0) await redisClient.del(`room:${roomCode}`);
    } else {
      const room = roomsMap.get(roomCode);
      if (room) {
        delete room[socketId];
        if (Object.keys(room).length === 0) roomsMap.delete(roomCode);
      }
    }
  };

  const listParticipants = async (roomCode) => {
    if (redisClient) {
      const vals = await redisClient.hVals(`room:${roomCode}`);
      return vals.map((v) => JSON.parse(v));
    } else {
      const room = roomsMap.get(roomCode) || {};
      return Object.values(room);
    }
  };

  const getRoomBySocket = async (socketId) => {
    if (redisClient) {
      return await redisClient.get(`socket:${socketId}`); // returns roomCode or null
    } else {
      for (const [code, participants] of roomsMap.entries()) {
        if (participants[socketId]) return code;
      }
      return null;
    }
  };

  // Attach socket event handlers
  io.on("connection", (socket) => {
    console.log("⚡ socket connected:", socket.id);

    socket.on("join-room", async ({ roomCode, user }, cb) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) return cb && cb({ error: "Room not found" });

        socket.join(roomCode);
        await addParticipant(roomCode, socket.id, user);

        const participants = await listParticipants(roomCode);
        io.to(roomCode).emit("participants-update", participants);

        const msgs = await Message.find({ room: room._id }).sort({ createdAt: 1 }).limit(100);
        socket.emit("chat-history", msgs);

        cb && cb({ ok: true, roomId: room._id });
      } catch (err) {
        console.error("join-room error:", err);
        cb && cb({ error: "Server error" });
      }
    });

    socket.on("leave-room", async ({ roomCode }, cb) => {
      try {
        socket.leave(roomCode);
        await removeParticipant(roomCode, socket.id);
        const participants = await listParticipants(roomCode);
        io.to(roomCode).emit("participants-update", participants);
        cb && cb({ ok: true });
      } catch (err) {
        console.error("leave-room error:", err);
        cb && cb({ error: "Server error" });
      }
    });

    socket.on("send-message", async ({ roomCode, roomId, text, sender }, cb) => {
      try {
        const message = await Message.create({
          room: roomId,
          sender: sender.id,
          senderName: sender.name,
          text,
        });
        io.to(roomCode).emit("new-message", message);
        cb && cb({ ok: true, message });
      } catch (err) {
        console.error("send-message error:", err);
        cb && cb({ error: "Could not save message" });
      }
    });

    socket.on("signal", ({ toSocketId, data }) => {
      // WebRTC signaling forwarder
      io.to(toSocketId).emit("signal", { from: socket.id, data });
    });

    socket.on("disconnect", async (reason) => {
      try {
        // Prefer quick lookup via socket->room mapping if using redis; otherwise scan in-memory
        const roomCode = await getRoomBySocket(socket.id);
        if (roomCode) {
          await removeParticipant(roomCode, socket.id);
          const participants = await listParticipants(roomCode);
          io.to(roomCode).emit("participants-update", participants);
        }
      } catch (err) {
        console.error("disconnect cleanup error:", err);
      }
      console.log("🔌 socket disconnected:", socket.id, "reason:", reason);
    });
  });
};
