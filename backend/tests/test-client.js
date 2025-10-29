 // backend/tests/test-client.js
import { io } from "socket.io-client";

const args = process.argv.slice(2);
if (args.length < 5) {
  console.log("Usage: node tests/test-client.js <serverUrl> <roomCode> <roomId> <userId> <userName> [--no-exit]");
  process.exit(1);
}

const [serverUrl, roomCode, roomId, userId, userName, maybeFlag] = args;
const keepAlive = maybeFlag === "--no-exit";

const socket = io(serverUrl, { withCredentials: true });

socket.on("connect", () => {
  console.log(`[${userName}] Connected: ${socket.id}`);

  socket.emit("join-room", { roomCode, user: { id: userId, name: userName } }, (res) => {
    console.log(`[${userName}] join-room response:`, res);
  });

  // send one test message after short delay
  setTimeout(() => {
    socket.emit(
      "send-message",
      { roomCode, roomId, text: `Hello from ${userName}`, sender: { id: userId, name: userName } },
      (res) => console.log(`[${userName}] send-message response:`, res)
    );
  }, 1500);
});

socket.on("participants-update", (participants) => {
  console.log(`[${userName}] participants-update:`, participants);
});

socket.on("chat-history", (messages) => {
  console.log(`[${userName}] chat-history count:`, messages.length);
});

socket.on("new-message", (msg) => {
  console.log(`[${userName}] new-message:`, msg.text ?? msg);
});

socket.on("disconnect", () => {
  console.log(`[${userName}] ❌ Disconnected`);
  if (!keepAlive) process.exit(0);
});

// If not using --no-exit, disconnect after 30s (longer to allow manual testing)
if (!keepAlive) {
  setTimeout(() => {
    console.log(`[${userName}] leaving room and disconnecting (auto)...`);
    socket.emit("leave-room", { roomCode }, (res) => {
      console.log(`[${userName}] leave-room resp:`, res);
      socket.disconnect();
      process.exit(0);
    });
  }, 30000); // 30s
}
