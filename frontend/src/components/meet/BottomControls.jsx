 import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Users,
  PhoneOff
} from "lucide-react";
import { useState } from "react";

export default function BottomControls({ activeTab, setActiveTab, onEndCall}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Toggle drawer logic
  const toggleTab = (tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2
      bg-[#1f1f1f] px-6 py-3 rounded-full
      flex items-center gap-4 shadow-lg"
    >
      {/* MIC */}
      <ControlButton
        active={micOn}
        onClick={() => setMicOn(!micOn)}
        icon={micOn ? <Mic size={20} /> : <MicOff size={20} />}
      />

      {/* CAMERA */}
      <ControlButton
        active={camOn}
        onClick={() => setCamOn(!camOn)}
        icon={camOn ? <Video size={20} /> : <VideoOff size={20} />}
      />

      {/* CHAT */}
      <ControlButton
        active={activeTab === "chat"}
        onClick={() => toggleTab("chat")}
        icon={<MessageSquare size={20} />}
      />

      {/* PEOPLE */}
      <ControlButton
        active={activeTab === "people"}
        onClick={() => toggleTab("people")}
        icon={<Users size={20} />}
      />

      {/* END CALL */}
      <button onClick={onEndCall} className="bg-red-600 hover:bg-red-700 text-white
        p-3 rounded-full transition">
        <PhoneOff size={20} />
      </button>
    </div>
  );
}

/* ---------- BUTTON ---------- */
function ControlButton({ icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-full transition
        ${active
          ? "bg-blue-600 text-white"
          : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"}
      `}
    >
      {icon}
    </button>
  );
}
