 import { io } from "socket.io-client";

const socket = io("http://localhost:2810", {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
});

// Debug logs (optional)
socket.on("connect", () => {
 });

socket.on("disconnect", (reason) => {
 });

export default socket;
