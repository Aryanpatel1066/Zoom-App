 import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";

import MeetStage from "../components/meet/MeeStage";
import BottomControls from "../components/meet/BottomControls";
import ChatDrawer from "../components/meet/ChatDrawer";
import PeopleDrawer from "../components/meet/PeopleDrawer";

export default function Room() {
  const { user } = useAuth();
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id");
  const navigate = useNavigate();

  /* ---------------- SOCKET ---------------- */
  const socketRef = useSocket({ serverUrl: "http://localhost:2810" });
  // const socket = socketRef.current;

  /* ---------------- STATE ---------------- */
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);

  const messagesRef = useRef(null);

  /* ---------------- JOIN ROOM ---------------- */
  // useEffect(() => {
  //   if (!socket || !user) return;

  //   const handleConnect = () => {
  //     setMySocketId(socket.id);
  //   };

  //   socket.on("connect", handleConnect);
  //   if (socket.connected) handleConnect();

  //   socket.emit("join-room", {
  //     roomCode,
  //     user: {
  //       id: user._id || user.id,
  //       name: user.firstName || user.name,
  //       email: user.email || null
  //     }
  //   });

  //   socket.on("participants-update", setParticipants);
  //   socket.on("chat-history", setMessages);
  //   socket.on("new-message", (msg) =>
  //     setMessages((prev) => [...prev, msg])
  //   );

  //   return () => {
  //     socket.emit("leave-room", { roomCode });
  //     socket.off("connect", handleConnect);
  //     socket.off("participants-update");
  //     socket.off("chat-history");
  //     socket.off("new-message");
  //   };
  // }, [socket, roomCode, user]);
useEffect(() => {
  if (!user) return;

  const socket = socketRef.current;
  if (!socket) return;

  const handleConnect = () => {
    setMySocketId(socket.id);
  };

  socket.on("connect", handleConnect);
  if (socket.connected) handleConnect();

  socket.emit("join-room", {
    roomCode,
    user: {
      id: user._id || user.id,
      name: user.firstName || user.name,
      email: user.email || null
    }
  });

  socket.on("participants-update", setParticipants);
  socket.on("chat-history", setMessages);
  socket.on("new-message", (msg) =>
    setMessages((prev) => [...prev, msg])
  );

  return () => {
    socket.emit("leave-room", { roomCode });
    socket.off("connect", handleConnect);
    socket.off("participants-update");
    socket.off("chat-history");
    socket.off("new-message");
  };
}, [roomCode, user]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      roomCode,
      roomId,
      text,
      sender: {
        id: user._id || user.id,
        name: user.firstName || user.name
      }
    });

    setText("");
  };

  /* ---------------- END CALL ---------------- */
 
const handleEndCall = () => {
  const socket = socketRef.current;
  if (!socket) return;

  socket.emit("leave-room", { roomCode }, () => {
    socket.disconnect();
    navigate("/landing");
  });
};

  /* ---------------- UI ---------------- */
  return (
<div className="h-screen flex bg-black relative overflow-hidden min-h-0 border-4 border-red-500">
 
      {/* CENTER VIDEO GRID */}
      <MeetStage participants={participants} />

      {/* CHAT DRAWER */}
      {activeTab === "chat" && (
        <ChatDrawer
          messages={messages}
          text={text}
          setText={setText}
          sendMessage={sendMessage}
          messagesRef={messagesRef}
          onClose={() => setActiveTab(null)}
        />
      )}

      {/* PEOPLE DRAWER */}
      {activeTab === "people" && (
        <PeopleDrawer
          participants={participants}
          mySocketId={mySocketId}
          onClose={() => setActiveTab(null)}
        />
      )}

      {/* CONTROLS */}
      <BottomControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onEndCall={handleEndCall}
      />
    </div>
  );
}
