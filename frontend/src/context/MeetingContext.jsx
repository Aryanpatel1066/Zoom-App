import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import socket from "../socket";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const MeetingContext = createContext(null);

export const MeetingProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id");
  const navigate = useNavigate();
  /* ---------------- STATE ---------------- */
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);

  const messagesRef = useRef(null);

  const myUserId = user?._id || user?.id;

  /* ---------------- SOCKET INIT ---------------- */
  useEffect(() => {
    if (loading || !user) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setMySocketId(socket.id);

      //  ALWAYS rejoin room on connect / reconnect
      socket.emit("join-room", {
        roomCode,
        user: {
          id: myUserId,
          name: user.firstName || user.name,
          email: user.email || null,
        },
      });
    };

    socket.on("connect", handleConnect);
    handleConnect();

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, loading, roomCode, myUserId]);

  /* ---------------- SOCKET LISTENERS ---------------- */
  useEffect(() => {
    if (loading || !user) return;

    const onParticipantsUpdate = (list) => {
      setParticipants(list);
    };

    const onChatHistory = (msgs) => {
      // normalize sender name
      const normalized = msgs.map((m) => ({
        ...m,
        senderName:
          m.sender?.name || m.senderName || m.sender?.user?.name || "User",
      }));
      setMessages(normalized);
    };

    const onNewMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          senderName:
            msg.sender?.name ||
            msg.senderName ||
            msg.sender?.user?.name ||
            "User",
        },
      ]);
    };

    socket.on("participants-update", onParticipantsUpdate);
    socket.on("chat-history", onChatHistory);
    socket.on("new-message", onNewMessage);

    return () => {
      socket.off("participants-update", onParticipantsUpdate);
      socket.off("chat-history", onChatHistory);
      socket.off("new-message", onNewMessage);
    };
  }, [user, loading]);

  /* ---------------- ACTIONS ---------------- */
  const sendMessage = useCallback(() => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      roomCode,
      roomId,
      text,
      sender: {
        id: myUserId,
        name: user.firstName || user.name,
      },
    });

    setText("");
  }, [text, roomCode, roomId, user, myUserId]);

  const endCall = useCallback(() => {
    socket.emit("leave-room", { roomCode });
    navigate("/landing");
  }, [roomCode, navigate]);

  /* ---------------- MEMO VALUE ---------------- */
  const value = useMemo(
    () => ({
      participants,
      messages,
      text,
      setText,
      sendMessage,
      activeTab,
      setActiveTab,
      mySocketId,
      myUserId,
      messagesRef,
      endCall,
    }),
    [
      participants,
      messages,
      text,
      activeTab,
      mySocketId,
      myUserId,
      sendMessage,
      endCall,
    ]
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
};

export const useMeeting = () => useContext(MeetingContext);
