// Updated Server Setup with WebRTC Socket Handler
// File: backend/server.js

import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { webrtcSocketHandler } from "./sockets/webrtcSocketHandler.js"; // NEW: Import WebRTC handler

const app = express();

app.use(cookieParser());
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Mount routes
app.use("/zoom/api/v1/auth", authRoutes);
app.use("/zoom/api/v1/rooms", roomRoutes);
app.use("/zoom/api/v1/chat", chatRoutes);

const httpServer = createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
  transports: ["websocket", "polling"],
  maxHttpBufferSize: 1e6, // 1MB for larger offers/answers
});

const start = async () => {
  try {
    // 1) Connect MongoDB
    await connectDB();
    console.log("✅ MongoDB connected");

    // 2) Connect Redis (optional adapter)
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    let pubClient = null;
    let subClient = null;

    try {
      pubClient = createClient({ url: redisUrl });
      subClient = pubClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Redis connected and adapter attached");
    } catch (err) {
      console.warn("⚠️ Redis not available, continuing without adapter (single-instance only)");
      console.warn(err.message);
    }

    // 3) Attach WebRTC Socket Handlers
    await webrtcSocketHandler(io, pubClient); // NEW: Use WebRTC handler
    console.log("✅ WebRTC socket handlers attached");

    // 4) Start server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🎯 WebRTC Mesh Topology Enabled`);
    });
  } catch (err) {
    console.error("💥 Startup error:", err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("⏹️  Shutting down gracefully...");
  process.exit(0);
});