// CRITICAL FIX: MeetingContext - Remote streams properly captured
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
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connecting, setConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const messagesRef = useRef(null);
  const webrtcRef = useRef(null);
  const myUserId = user?._id || user?.id;
  const remoteStreamsRef = useRef(new Map()); // Keep track of streams

  console.log("📱 MeetingContext State:", {
    socketId: mySocketId,
    hasLocalStream: !!localStream,
    participantsCount: participants.length,
    remoteStreamsCount: remoteStreams.size,
  });

  /* ---------- INITIALIZE WebRTC MANAGER ---------- */
  useEffect(() => {
    console.log("🚀 Initializing WebRTC Manager...");
    webrtcRef.current = new WebRTCManager(socket);
    console.log("✅ WebRTC Manager created");

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.stopLocalStream();
      }
    };
  }, []);

  /* ---------- GET LOCAL STREAM ---------- */
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        if (!webrtcRef.current) {
          console.warn("⚠️ WebRTC Manager not ready");
          return;
        }

        setConnecting(true);
        setConnectionError(null);

        console.log("🎥 Requesting camera/microphone...");
        const stream = await webrtcRef.current.getLocalStream();
        setLocalStream(stream);

        webrtcRef.current.toggleAudio(micOn);
        webrtcRef.current.toggleVideo(camOn);

        console.log("✅ Local stream ready");
      } catch (err) {
        console.error("❌ Failed to get local stream:", err.message);
        setConnectionError(err.message);
      } finally {
        setConnecting(false);
      }
    };

    if (!loading && user && webrtcRef.current?.localStream === null) {
      initLocalStream();
    }
  }, [loading, user]);

  /* ---------- SOCKET CONNECTION & ROOM JOIN ---------- */
  useEffect(() => {
    if (loading || !user || !localStream) return;

    console.log("🔌 Connecting to socket...");

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("⚡ Socket connected:", socket.id);
      setMySocketId(socket.id);

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
  }, [user, loading, roomCode, myUserId, localStream]);

  /* ---------- WEBRTC SIGNALING LISTENERS ---------- */
  useEffect(() => {
    if (loading || !user || !webrtcRef.current) return;

    console.log("📡 Setting up WebRTC listeners...");

    // When peer list received
    const handlePeerList = async (peerList) => {
      console.log("📋 Peer list:", peerList.map((p) => p.socketId));
      for (const peer of peerList) {
        if (peer.socketId !== socket.id) {
          await initiatePeerConnection(peer.socketId);
        }
      }
    };

    // When new peer joins
    const handlePeerJoined = async (data) => {
      console.log("👤 New peer joined:", data.socketId, data.name);
      await initiatePeerConnection(data.socketId);
    };

    // When peer leaves
    const handlePeerLeft = (data) => {
      console.log("👋 Peer left:", data.socketId);
      webrtcRef.current?.closePeerConnection(data.socketId);

      // IMPORTANT: Remove from remoteStreams
      setRemoteStreams((prev) => {
        const updated = new Map(prev);
        updated.delete(data.socketId);
        remoteStreamsRef.current.delete(data.socketId);
        console.log("🔌 Removed peer stream, remaining:", updated.size);
        return updated;
      });
    };

    // Receive WebRTC offer
    const handleWebRTCOffer = async (data) => {
      console.log("📥 Offer from:", data.from);
      try {
        await webrtcRef.current.handleOffer(data.from, data.offer);
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    // Receive WebRTC answer
    const handleWebRTCAnswer = async (data) => {
      console.log("📥 Answer from:", data.from);
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
      console.log("👥 Participants update:", list.length, list.map((p) => p.name));
      setParticipants(list);
    };

    const onChatHistory = (msgs) => {
      console.log("💬 Chat history:", msgs.length);
      const normalized = msgs.map((m) => ({
        ...m,
        senderName: m.sender?.name || m.senderName || "User",
      }));
      setMessages(normalized);
    };

    const onNewMessage = (msg) => {
      setMessages((prev) => [...prev, { ...msg, senderName: msg.senderName || msg.sender?.name || "User" }]);
      setTimeout(() => messagesRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const onMediaStatusUpdate = (data) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === data.socketId ? { ...p, mediaStatus: { audio: data.audio, video: data.video } } : p
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

  // Initiate peer connection - CRITICAL FIX
  const initiatePeerConnection = useCallback(async (peerId) => {
    try {
      if (!webrtcRef.current) {
        console.warn("⚠️ WebRTC not ready");
        return;
      }

      console.log(`🤝 Initiating connection with ${peerId}`);

      const peerConnection = webrtcRef.current.createPeerConnection(
        peerId,
        (peerId, stream) => {
          console.log(`🎥 RECEIVED REMOTE STREAM from ${peerId}:`, {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
          });

          // CRITICAL: Store in both ref and state
          remoteStreamsRef.current.set(peerId, stream);
          
          // Update state to trigger re-render
          setRemoteStreams((prev) => {
            const updated = new Map(prev);
            updated.set(peerId, stream);
            console.log(`✅ Remote streams count: ${updated.size}`);
            return updated;
          });
        }
      );

      // Send offer after delay
      setTimeout(async () => {
        try {
          await webrtcRef.current.createAndSendOffer(peerId);
          console.log(`✅ Offer sent to ${peerId}`);
        } catch (err) {
          console.error(`❌ Error sending offer to ${peerId}:`, err);
        }
      }, 300);
    } catch (err) {
      console.error("❌ Error initiating peer connection:", err);
    }
  }, []);

  // Toggle microphone
  const toggleMic = useCallback(
    (enable) => {
      console.log("🎙️ Toggle mic:", enable ? "ON" : "OFF");
      setMicOn(enable);
      webrtcRef.current?.toggleAudio(enable);
      socket.emit("media-status", {
        roomCode,
        audio: enable,
        video: camOn,
      });
    },
    [roomCode, camOn]
  );

  // Toggle camera
  const toggleCamera = useCallback(
    (enable) => {
      console.log("📹 Toggle camera:", enable ? "ON" : "OFF");
      setCamOn(enable);
      webrtcRef.current?.toggleVideo(enable);
      socket.emit("media-status", {
        roomCode,
        audio: micOn,
        video: enable,
      });
    },
    [roomCode, micOn]
  );

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
    console.log("📞 Ending call...");
    if (webrtcRef.current) {
      webrtcRef.current.closeAllConnections();
      webrtcRef.current.stopLocalStream();
    }
    socket.emit("leave-room", { roomCode });
    navigate("/landing");
  }, [roomCode, navigate]);

  /* ---------- CONTEXT VALUE ---------- */
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
      remoteStreams, // This is the critical state
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

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting must be used within MeetingProvider");
  }
  return context;
};