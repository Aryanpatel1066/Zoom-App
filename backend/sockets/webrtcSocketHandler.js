// Enhanced Socket Handler with WebRTC Mesh Signaling
// File: backend/sockets/webrtcSocketHandler.js

import mongoose from "mongoose";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import WebRTCPeerManager from "../utils/webrtcPeerManager.js";

export const webrtcSocketHandler = async (io, redisClient) => {
  const roomsMap = new Map(); // roomCode -> Set of socketIds
  const peerManagers = new Map(); // roomCode -> WebRTCPeerManager
  const userStreams = new Map(); // socketId -> { audio, video }

  // Create peer manager for room
  const createRoomPeerManager = (roomCode) => {
    if (!peerManagers.has(roomCode)) {
      peerManagers.set(roomCode, new WebRTCPeerManager());
    }
    return peerManagers.get(roomCode);
  };

  // Add participant
  const addParticipant = async (roomCode, socketId, user) => {
    const payload = {
      socketId,
      userId: user.id,
      name: user.name,
      email: user.email,
      isHost: user.isHost,
      joinedAt: new Date().toISOString(),
      mediaStatus: { audio: true, video: true },
    };

    if (redisClient) {
      await redisClient.hSet(`room:${roomCode}`, socketId, JSON.stringify(payload));
      await redisClient.set(`socket:${socketId}`, roomCode, { EX: 60 * 60 * 24 });
    } else {
      if (!roomsMap.has(roomCode)) roomsMap.set(roomCode, new Set());
      roomsMap.get(roomCode).add(socketId);
    }
  };

  // Remove participant
  const removeParticipant = async (roomCode, socketId) => {
    if (redisClient) {
      await redisClient.hDel(`room:${roomCode}`, socketId);
      await redisClient.del(`socket:${socketId}`);
      const len = await redisClient.hLen(`room:${roomCode}`);
      if (len === 0) {
        await redisClient.del(`room:${roomCode}`);
        peerManagers.delete(roomCode);
      }
    } else {
      const room = roomsMap.get(roomCode);
      if (room) {
        room.delete(socketId);
        if (room.size === 0) {
          roomsMap.delete(roomCode);
          peerManagers.delete(roomCode);
        }
      }
    }
    userStreams.delete(socketId);
  };

  // List participants
  const listParticipants = async (roomCode) => {
    if (redisClient) {
      const vals = await redisClient.hVals(`room:${roomCode}`);
      return vals.map((v) => {
        try {
          return JSON.parse(v);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
    } else {
      const room = roomsMap.get(roomCode) || new Set();
      return Array.from(room).map(socketId => ({
        socketId,
      }));
    }
  };

  // Get room by socket
  const getRoomBySocket = async (socketId) => {
    if (redisClient) {
      return await redisClient.get(`socket:${socketId}`);
    } else {
      for (const [code, participants] of roomsMap.entries()) {
        if (participants.has(socketId)) return code;
      }
      return null;
    }
  };

  io.on("connection", (socket) => {
    console.log("⚡ socket connected:", socket.id);

    // Join room
    socket.on("join-room", async ({ roomCode, user }, cb) => {
      try {
        console.log("join-room request:", { socket: socket.id, roomCode, user });

        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          console.warn("join-room: room not found:", roomCode);
          return cb && cb({ error: "Room not found" });
        }

        const isHost = user.id === room.host.toString();
        socket.join(roomCode);

        const participant = { ...user, isHost };
        await addParticipant(roomCode, socket.id, participant);

        const participants = await listParticipants(roomCode);
        io.to(roomCode).emit("participants-update", participants);

        // Get chat history
        const msgs = await Message.find({ room: room._id }).sort({ createdAt: 1 }).limit(100);
        socket.emit("chat-history", msgs);

        // Send peer list (everyone except self)
        const peerList = participants.filter(p => p.socketId !== socket.id);
        socket.emit("peer-list", peerList);

        // Notify others about new peer
        socket.to(roomCode).emit("peer-joined", {
          socketId: socket.id,
          name: user.name,
        });

        cb && cb({ ok: true, roomId: room._id.toString() });
      } catch (err) {
        console.error("join-room error:", err);
        cb && cb({ error: "Server error" });
      }
    });

    // WebRTC: Initiate offer to peer
    socket.on("webrtc-offer", async ({ to, offer }, cb) => {
      try {
        console.log(`Offer from ${socket.id} to ${to}`);
        socket.to(to).emit("webrtc-offer", {
          from: socket.id,
          offer,
        });
        cb && cb({ ok: true });
      } catch (err) {
        console.error("webrtc-offer error:", err);
        cb && cb({ error: "Failed to send offer" });
      }
    });

    // WebRTC: Answer from peer
    socket.on("webrtc-answer", async ({ to, answer }, cb) => {
      try {
        console.log(`Answer from ${socket.id} to ${to}`);
        socket.to(to).emit("webrtc-answer", {
          from: socket.id,
          answer,
        });
        cb && cb({ ok: true });
      } catch (err) {
        console.error("webrtc-answer error:", err);
        cb && cb({ error: "Failed to send answer" });
      }
    });

    // WebRTC: ICE candidate
    socket.on("webrtc-ice-candidate", async ({ to, candidate }, cb) => {
      try {
        socket.to(to).emit("webrtc-ice-candidate", {
          from: socket.id,
          candidate,
        });
        cb && cb({ ok: true });
      } catch (err) {
        console.error("webrtc-ice-candidate error:", err);
        cb && cb({ error: "Failed to send ICE candidate" });
      }
    });

    // Update media status
    socket.on("media-status", async ({ roomCode, audio, video }, cb) => {
      try {
        if (redisClient) {
          const participantStr = await redisClient.hGet(`room:${roomCode}`, socket.id);
          if (participantStr) {
            const participant = JSON.parse(participantStr);
            participant.mediaStatus = { audio, video };
            await redisClient.hSet(`room:${roomCode}`, socket.id, JSON.stringify(participant));
          }
        }

        io.to(roomCode).emit("media-status-update", {
          socketId: socket.id,
          audio,
          video,
        });

        cb && cb({ ok: true });
      } catch (err) {
        console.error("media-status error:", err);
        cb && cb({ error: "Failed to update media status" });
      }
    });

    // Send message
    socket.on("send-message", async (payload, cb) => {
      try {
        let { roomCode, roomId, text, sender } = payload || {};

        if (!sender || !sender.id || !sender.name) {
          const errMsg = "Invalid sender in send-message";
          console.warn(errMsg, { sender });
          return cb && cb({ error: errMsg });
        }

        if (!roomId) {
          if (!roomCode) {
            const errMsg = "Missing roomCode and roomId in send-message";
            console.warn(errMsg);
            return cb && cb({ error: errMsg });
          }
          const roomDoc = await Room.findOne({ code: roomCode });
          if (!roomDoc) {
            const errMsg = "Room not found by code";
            console.warn(errMsg, { roomCode });
            return cb && cb({ error: errMsg });
          }
          roomId = roomDoc._id.toString();
        }

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          const errMsg = "Invalid roomId format";
          console.warn(errMsg, { roomId });
          return cb && cb({ error: errMsg });
        }

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

    // Leave room
    socket.on("leave-room", async ({ roomCode }, cb) => {
      try {
        socket.leave(roomCode);
        await removeParticipant(roomCode, socket.id);
        const participants = await listParticipants(roomCode);
        io.to(roomCode).emit("participants-update", participants);

        // Notify all peers to close connection with this socket
        io.to(roomCode).emit("peer-left", { socketId: socket.id });

        cb && cb({ ok: true });
      } catch (err) {
        console.error("leave-room error:", err);
        cb && cb({ error: "Server error" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async (reason) => {
      try {
        const roomCode = await getRoomBySocket(socket.id);
        if (roomCode) {
          await removeParticipant(roomCode, socket.id);
          const participants = await listParticipants(roomCode);
          io.to(roomCode).emit("participants-update", participants);
          io.to(roomCode).emit("peer-left", { socketId: socket.id });
        }
      } catch (err) {
        console.error("disconnect cleanup error:", err);
      }
      console.log("🔌 socket disconnected:", socket.id, "reason:", reason);
    });
  });
};

export default webrtcSocketHandler;