// src/pages/Room.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function ParticipantsList({ participants }) {
  return (
    <div className="p-3">
      <h3 className="text-lg font-semibold mb-2">Participants ({participants?.length || 0})</h3>
      <ul>
        {participants?.map((p) => (
          <li key={p.socketId} className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">{(p.name||"U").charAt(0)}</div>
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">id: {p.userId}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Room() {
  const { user } = useAuth();
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id"); // may be null when joining only by code
  const navigate = useNavigate();

  const socketRef = useSocket({ serverUrl: "http://localhost:2810" });
  const socket = socketRef.current;

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesRef = useRef();

  // join on mount
  useEffect(() => {
    if (!socketRef.current) return;
    const s = socketRef.current;

    const handleParticipants = (list) => {
      setParticipants(list);
    };
    const handleHistory = (msgs) => {
      setMessages(msgs);
      scrollToBottom();
    };
    const handleNew = (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    };

    s.on("participants-update", handleParticipants);
    s.on("chat-history", handleHistory);
    s.on("new-message", handleNew);

    // emit join-room once connected
    if (s.connected) {
      s.emit("join-room", { roomCode, user: { id: user._id || user.id, name: user.firstName || user.name } }, (res) => {
        if (res?.error) {
          alert(res.error);
          navigate("/home");
          return;
        }
        console.log("Joined room:", res);
      });
    } else {
      s.on("connect", () => {
        s.emit("join-room", { roomCode, user: { id: user._id || user.id, name: user.firstName || user.name } }, (res) => {
          if (res?.error) {
            alert(res.error);
            navigate("/home");
            return;
          }
          console.log("Joined room:", res);
        });
      });
    }

    return () => {
      s.emit("leave-room", { roomCode }, () => {});
      s.off("participants-update", handleParticipants);
      s.off("chat-history", handleHistory);
      s.off("new-message", handleNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef, roomCode, roomId, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    socketRef.current.emit(
      "send-message",
      {
        roomCode,
        roomId,
        text,
        sender: { id: user._id || user.id, name: user.firstName || user.name },
      },
      (ack) => {
        if (ack?.error) {
          console.error("message error", ack);
        }
      }
    );
    setText("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
      <div className="lg:col-span-2 bg-white rounded shadow p-4">
        <div className="h-96 overflow-y-auto p-3 border rounded mb-3 bg-gray-50">
          {messages.map((m) => (
            <div key={m._id || Math.random()} className="mb-3">
              <div className="text-sm font-semibold">{m.senderName}</div>
              <div className="text-sm">{m.text}</div>
              <div className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
          <div ref={messagesRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded">
            Send
          </button>
        </div>
      </div>

      <aside className="bg-white rounded shadow p-4">
        <ParticipantsList participants={participants} />
      </aside>
    </div>
  );
}
