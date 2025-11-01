 import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import mongoose from "mongoose";

import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { redisSocketHandler } from "./sockets/redisSocketHandler.js";

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

// mount routes
app.use("/zoom/api/v1/auth", authRoutes);
app.use("/zoom/api/v1/rooms", roomRoutes);
app.use("/zoom/api/v1/chat", chatRoutes);

const httpServer = createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
});

const start = async () => {
  try {
    // 1) connect Mongo
    await connectDB();
 
    // 2) try to connect Redis (adapter) - if Redis missing we log and continue w/o adapter
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
      console.warn("⚠️ Redis not available, continuing without adapter (single-instance only).");
      console.warn(err.message); 
    }

    // 3) attach socket handlers (pass redis client if available)
    await redisSocketHandler(io, pubClient); // handler attaches listeners

    const PORT = process.env.PORT || 1066;
    httpServer.listen(PORT, () => console.log(`🚀 Server + Socket.IO running on port ${PORT}`));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

start();
