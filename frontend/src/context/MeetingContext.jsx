// FIXED Meeting Context with Proper WebRTC Initialization
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

  /* ---------- INITIALIZE WebRTC MANAGER (First!) ---------- */
  useEffect(() => {
    console.log("📱 Initializing WebRTC Manager...");
    webrtcRef.current = new WebRTCManager(socket);
    console.log("✅ WebRTC Manager created");

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.stopLocalStream();
      }
    };
  }, []);

  /* ---------- GET LOCAL STREAM (After WebRTC Init) ---------- */
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        // Check if WebRTC manager is initialized
        if (!webrtcRef.current) {
          console.warn("⚠️ WebRTC Manager not ready yet");
          return;
        }

        setConnecting(true);
        setConnectionError(null);

        console.log("🎥 Requesting camera/microphone access...");
        
        // Request media with fallback for audio only if video fails
        try {
          const stream = await webrtcRef.current.getLocalStream();
          setLocalStream(stream);
          console.log("✅ Local stream acquired");
        } catch (err) {
          console.error("❌ Failed to get camera:", err);
          
          // Fallback to audio only
          try {
            console.log("📢 Falling back to audio only...");
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true },
              video: false,
            });
            setLocalStream(audioStream);
            console.log("✅ Audio-only stream acquired");
            setConnectionError("Camera unavailable - using audio only");
          } catch (audioErr) {
            console.error("❌ Failed to get audio:", audioErr);
            setConnectionError("Unable to access camera or microphone");
            throw audioErr;
          }
        }
      } catch (err) {
        console.error("❌ Critical error getting local stream:", err);
        setConnectionError(`Failed to access media: ${err.message}`);
      } finally {
        setConnecting(false);
      }
    };

    // Only init stream after user is loaded and WebRTC manager exists
    if (!loading && user && webrtcRef.current) {
      initLocalStream();
    }
  }, [loading, user]);

  /* ---------- UPDATE MEDIA CONSTRAINTS WHEN MIC/CAM TOGGLE ---------- */
  useEffect(() => {
    if (!webrtcRef.current || !localStream) return;

    console.log(`🔧 Updating media state - Audio: ${micOn}, Video: ${camOn}`);
    webrtcRef.current.toggleAudio(micOn);
    webrtcRef.current.toggleVideo(camOn);
  }, [micOn, camOn, localStream]);

  /* ---------- SOCKET CONNECTION & ROOM JOIN ---------- */
  useEffect(() => {
    if (loading || !user || !localStream) return;

    console.log("🔌 Setting up socket connection...");

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("⚡ Socket connected:", socket.id);
      setMySocketId(socket.id);

      // Join room with user data
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
    
    // If already connected, call handler immediately
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

    console.log("📡 Setting up WebRTC signaling listeners...");

    // When peer list received, initiate connections
    const handlePeerList = async (peerList) => {
      console.log("📋 Peer list received:", peerList.length, "peers");
      for (const peer of peerList) {
        if (peer.socketId !== socket.id) {
          await initiatePeerConnection(peer.socketId);
        }
      }
    };

    // When new peer joins
    const handlePeerJoined = async (data) => {
      console.log("👤 Peer joined:", data.socketId, data.name);
      await initiatePeerConnection(data.socketId);
    };

    // When peer leaves
    const handlePeerLeft = (data) => {
      console.log("👋 Peer left:", data.socketId);
      webrtcRef.current?.closePeerConnection(data.socketId);
      setRemoteStreams(prev => {
        const updated = new Map(prev);
        updated.delete(data.socketId);
        return updated;
      });
    };

    // Receive offer
    const handleWebRTCOffer = async (data) => {
      console.log("📥 WebRTC Offer from:", data.from);
      try {
        await webrtcRef.current.handleOffer(data.from, data.offer);
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    // Receive answer
    const handleWebRTCAnswer = async (data) => {
      console.log("📥 WebRTC Answer from:", data.from);
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

    console.log("💬 Setting up chat listeners...");

    const onParticipantsUpdate = (list) => {
      console.log("👥 Participants updated:", list.length);
      setParticipants(list);
    };

    const onChatHistory = (msgs) => {
      console.log("📜 Chat history received:", msgs.length, "messages");
      const normalized = msgs.map((m) => ({
        ...m,
        senderName: m.sender?.name || m.senderName || m.sender?.user?.name || "User",
      }));
      setMessages(normalized);
    };

    const onNewMessage = (msg) => {
      console.log("💬 New message from:", msg.senderName);
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          senderName: msg.sender?.name || msg.senderName || msg.sender?.user?.name || "User",
        },
      ]);
      // Auto-scroll to latest message
      setTimeout(() => {
        messagesRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    const onMediaStatusUpdate = (data) => {
      console.log(`🎙️ Media status update from ${data.socketId}:`, { audio: data.audio, video: data.video });
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
      if (!webrtcRef.current) {
        console.warn("⚠️ WebRTC Manager not available");
        return;
      }

      console.log(`🤝 Initiating peer connection with ${peerId}`);

      const peerConnection = webrtcRef.current.createPeerConnection(
        peerId,
        (peerId, stream) => {
          console.log("🎥 Got remote stream from peer:", peerId);
          setRemoteStreams(prev => {
            const updated = new Map(prev);
            updated.set(peerId, stream);
            return updated;
          });
        }
      );

      // Wait a bit then send offer
      setTimeout(async () => {
        try {
          await webrtcRef.current.createAndSendOffer(peerId);
        } catch (err) {
          console.error("❌ Error sending offer to", peerId, ":", err);
        }
      }, 200);
    } catch (err) {
      console.error("❌ Error initiating peer connection:", err);
    }
  }, []);

  // Toggle microphone
  const toggleMic = useCallback((enable) => {
    console.log("🎙️ Toggle microphone:", enable ? "ON" : "OFF");
    setMicOn(enable);
    socket.emit("media-status", {
      roomCode,
      audio: enable,
      video: camOn,
    });
  }, [roomCode, camOn]);

  // Toggle camera
  const toggleCamera = useCallback((enable) => {
    console.log("📹 Toggle camera:", enable ? "ON" : "OFF");
    setCamOn(enable);
    socket.emit("media-status", {
      roomCode,
      audio: micOn,
      video: enable,
    });
  }, [roomCode, micOn]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!text.trim()) return;

    console.log("📤 Sending message...");
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