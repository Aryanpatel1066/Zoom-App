import express from "express"
import dotenv from "dotenv"
dotenv.config()
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server  as IOServer} from "socket.io"
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import roomRoutes from "./routes/roomRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"

//models used by socket 
import Message from "./models/Message.js";
import Room from "./models/Room.js";
const app = express();
//builting middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))
//custom routes
app.use("/zoom/api/v1/auth", authRoutes)
app.use("/zoom/api/v1/rooms",roomRoutes)
app.use("/zoom/api/v1/chat",chatRoutes)

//connect the database
connectDB();
 
//http and socket.IO
 const httpServer = createServer(app) 
const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});


 
//routes

// 🔥 socket.io logic here
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});
//step2: start the server
// const PORT = process.env.PORT || 1066
// app.listen(PORT,()=>console.log(`🚀 Server running on port ${PORT}`))
const PORT = process.env.PORT || 1066;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`)
);