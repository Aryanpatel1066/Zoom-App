 import { io } from "socket.io-client";

const socket = io("http://localhost:2810", {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
});

// Debug logs (optional)
socket.on("connect", () => {
  console.log("🟢 Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", reason);
});

export default socket;
