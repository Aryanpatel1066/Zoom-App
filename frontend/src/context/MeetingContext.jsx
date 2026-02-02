// Enhanced Meeting Context with WebRTC Mesh Integration
// File: frontend/context/MeetingContext.jsx

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
import WebRTCManager from "../utils/webrtcManager";

const MeetingContext = createContext(null);

export const MeetingProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id");
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // peerId -> stream
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connecting, setConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const messagesRef = useRef(null);
  const webrtcRef = useRef(null);
  const myUserId = user?._id || user?.id;

  /* ---------- INITIALIZE WebRTC MANAGER ---------- */
  useEffect(() => {
    if (!socket.connected) {
      webrtcRef.current = new WebRTCManager(socket);
    }
  }, []);

  /* ---------- GET LOCAL STREAM ---------- */
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        setConnecting(true);
        setConnectionError(null);
        
        const stream = await webrtcRef.current.getLocalStream();
        setLocalStream(stream);
        
        // Set initial media state
        webrtcRef.current.toggleAudio(micOn);
        webrtcRef.current.toggleVideo(camOn);
        
        console.log("✅ Local stream ready");
      } catch (err) {
        console.error("❌ Failed to get local stream:", err);
        setConnectionError("Failed to access camera/microphone");
      } finally {
        setConnecting(false);
      }
    };

    if (!loading && user) {
      initLocalStream();
    }

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.stopLocalStream();
      }
    };
  }, [loading, user, micOn, camOn]);

  /* ---------- SOCKET CONNECTION & ROOM JOIN ---------- */
  useEffect(() => {
    if (loading || !user || !webrtcRef.current?.localStream) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("⚡ Socket connected:", socket.id);
      setMySocketId(socket.id);

      // Join room
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
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, loading, roomCode, myUserId]);

  /* ---------- WEBRTC SIGNALING LISTENERS ---------- */
  useEffect(() => {
    if (loading || !user || !webrtcRef.current) return;

    // When peer list received, initiate connections
    const handlePeerList = async (peerList) => {
      console.log("📋 Peer list received:", peerList);
      for (const peer of peerList) {
        if (peer.socketId !== socket.id) {
          await initiatePeerConnection(peer.socketId);
        }
      }
    };

    // When new peer joins
    const handlePeerJoined = async (data) => {
      console.log("👤 Peer joined:", data.socketId);
      await initiatePeerConnection(data.socketId);
    };

    // When peer leaves
    const handlePeerLeft = (data) => {
      console.log("👋 Peer left:", data.socketId);
      webrtcRef.current.closePeerConnection(data.socketId);
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.delete(data.socketId);
        return updated;
      });
    };

    // Receive offer
    const handleWebRTCOffer = async (data) => {
      console.log("📥 Offer received from:", data.from);
      try {
        await webrtcRef.current.handleOffer(data.from, data.offer);
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    // Receive answer
    const handleWebRTCAnswer = async (data) => {
      console.log("📥 Answer received from:", data.from);
      try {
        await webrtcRef.current.handleAnswer(data.from, data.answer);
      } catch (err) {
        console.error("❌ Error handling answer:", err);
      }
    };

    // Receive ICE candidate
    const handleWebRTCICECandidate = async (data) => {
      try {
        await webrtcRef.current.handleICECandidate(data.from, data.candidate);
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    };

    socket.on("peer-list", handlePeerList);
    socket.on("peer-joined", handlePeerJoined);
    socket.on("peer-left", handlePeerLeft);
    socket.on("webrtc-offer", handleWebRTCOffer);
    socket.on("webrtc-answer", handleWebRTCAnswer);
    socket.on("webrtc-ice-candidate", handleWebRTCICECandidate);

    return () => {
      socket.off("peer-list", handlePeerList);
      socket.off("peer-joined", handlePeerJoined);
      socket.off("peer-left", handlePeerLeft);
      socket.off("webrtc-offer", handleWebRTCOffer);
      socket.off("webrtc-answer", handleWebRTCAnswer);
      socket.off("webrtc-ice-candidate", handleWebRTCICECandidate);
    };
  }, [user, loading]);

  /* ---------- CHAT & PARTICIPANTS LISTENERS ---------- */
  useEffect(() => {
    if (loading || !user) return;

    const onParticipantsUpdate = (list) => {
      setParticipants(list);
    };

    const onChatHistory = (msgs) => {
      const normalized = msgs.map((m) => ({
        ...m,
        senderName: m.sender?.name || m.senderName || m.sender?.user?.name || "User",
      }));
      setMessages(normalized);
    };

    const onNewMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          senderName: msg.sender?.name || msg.senderName || msg.sender?.user?.name || "User",
        },
      ]);
    };

    const onMediaStatusUpdate = (data) => {
      setParticipants(prev =>
        prev.map(p =>
          p.socketId === data.socketId
            ? { ...p, mediaStatus: { audio: data.audio, video: data.video } }
            : p
        )
      );
    };

    socket.on("participants-update", onParticipantsUpdate);
    socket.on("chat-history", onChatHistory);
    socket.on("new-message", onNewMessage);
    socket.on("media-status-update", onMediaStatusUpdate);

    return () => {
      socket.off("participants-update", onParticipantsUpdate);
      socket.off("chat-history", onChatHistory);
      socket.off("new-message", onNewMessage);
      socket.off("media-status-update", onMediaStatusUpdate);
    };
  }, [user, loading]);

  /* ---------- ACTIONS ---------- */

  // Initiate peer connection
  const initiatePeerConnection = useCallback(async (peerId) => {
    try {
      const peerConnection = webrtcRef.current.createPeerConnection(
        peerId,
        (peerId, stream) => {
          console.log("🎥 Got stream from peer:", peerId);
          setRemoteStreams(prev => new Map(prev).set(peerId, stream));
        }
      );

      // Wait a bit then send offer
      setTimeout(async () => {
        try {
          await webrtcRef.current.createAndSendOffer(peerId);
        } catch (err) {
          console.error("❌ Error sending offer:", err);
        }
      }, 100);
    } catch (err) {
      console.error("❌ Error initiating peer connection:", err);
    }
  }, []);

  // Toggle microphone
  const toggleMic = useCallback((enable) => {
    setMicOn(enable);
    webrtcRef.current?.toggleAudio(enable);
    socket.emit("media-status", {
      roomCode,
      audio: enable,
      video: camOn,
    });
  }, [roomCode, camOn]);

  // Toggle camera
  const toggleCamera = useCallback((enable) => {
    setCamOn(enable);
    webrtcRef.current?.toggleVideo(enable);
    socket.emit("media-status", {
      roomCode,
      audio: micOn,
      video: enable,
    });
  }, [roomCode, micOn]);

  // Send message
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

  // End call
  const endCall = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.closeAllConnections();
      webrtcRef.current.stopLocalStream();
    }
    socket.emit("leave-room", { roomCode });
    navigate("/landing");
  }, [roomCode, navigate]);

  /* ---------- VALUE MEMO ---------- */
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
      localStream,
      remoteStreams,
      micOn,
      camOn,
      toggleMic,
      toggleCamera,
      connecting,
      connectionError,
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
      localStream,
      remoteStreams,
      micOn,
      camOn,
      toggleMic,
      toggleCamera,
      connecting,
      connectionError,
    ]
  );

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting must be used within MeetingProvider");
  }
  return context;
};