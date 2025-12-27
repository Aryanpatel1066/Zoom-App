 import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import socket from "../socket";

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

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);

  const messagesRef = useRef(null);

  // 🔹 Join room
  useEffect(() => {
    if (!user) return;

    const handleConnect = () => {
      setMySocketId(socket.id);
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", handleConnect);
    handleConnect();

    socket.emit("join-room", {
      roomCode,
      user: {
        id: user._id || user.id,
        name: user.firstName || user.name,
        email: user.email || null,
      },
    });

    socket.on("participants-update", setParticipants);
    socket.on("chat-history", setMessages);
    socket.on("new-message", msg =>
      setMessages(prev => [...prev, msg])
    );

    return () => {
      socket.emit("leave-room", { roomCode });
      socket.off("connect", handleConnect);
      socket.off("participants-update");
      socket.off("chat-history");
      socket.off("new-message");
    };
  }, [roomCode, user]);

  // 🔹 Send message
  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      roomCode,
      roomId,
      text,
      sender: {
        id: user._id || user.id,
        name: user.firstName || user.name,
      },
    });

    setText("");
  };

  // 🔹 End call
  const handleEndCall = () => {
    socket.emit("leave-room", { roomCode });
    navigate("/landing");
  };

  return (
    <div className="h-screen flex bg-black relative overflow-hidden">
      <MeetStage participants={participants} />

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

      {activeTab === "people" && (
        <PeopleDrawer
          participants={participants}
          mySocketId={mySocketId}
          onClose={() => setActiveTab(null)}
        />
      )}

      <BottomControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onEndCall={handleEndCall}
      />
    </div>
  );
}
