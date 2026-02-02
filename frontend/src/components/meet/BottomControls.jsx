// Enhanced Bottom Controls Component
// File: frontend/components/meet/BottomControls.jsx

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Users,
  PhoneOff,
} from "lucide-react";
import { useState, memo, useCallback } from "react";
import { useMeeting } from "../../context/MeetingContext";

function BottomControls() {
  const {
    activeTab,
    setActiveTab,
    endCall,
    micOn,
    camOn,
    toggleMic,
    toggleCamera,
  } = useMeeting();

  const toggleTab = useCallback((tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, [setActiveTab]);

  const handleMicToggle = useCallback(() => {
    toggleMic(!micOn);
  }, [micOn, toggleMic]);

  const handleCameraToggle = useCallback(() => {
    toggleCamera(!camOn);
  }, [camOn, toggleCamera]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1f1f1f] px-6 py-3 rounded-full flex gap-4 shadow-lg border border-[#2a2a2a]">
      {/* Microphone Toggle */}
      <ControlButton
        active={micOn}
        onClick={handleMicToggle}
        icon={micOn ? <Mic size={20} /> : <MicOff size={20} />}
        title={micOn ? "Mute microphone" : "Unmute microphone"}
        activeColor="bg-green-600"
      />

      {/* Camera Toggle */}
      <ControlButton
        active={camOn}
        onClick={handleCameraToggle}
        icon={camOn ? <Video size={20} /> : <VideoOff size={20} />}
        title={camOn ? "Turn off camera" : "Turn on camera"}
        activeColor="bg-green-600"
      />

      {/* Divider */}
      <div className="w-px bg-[#2a2a2a]"></div>

      {/* Chat Tab */}
      <ControlButton
        active={activeTab === "chat"}
        onClick={() => toggleTab("chat")}
        icon={<MessageSquare size={20} />}
        title="Chat"
        activeColor="bg-blue-600"
      />

      {/* People Tab */}
      <ControlButton
        active={activeTab === "people"}
        onClick={() => toggleTab("people")}
        icon={<Users size={20} />}
        title="Participants"
        activeColor="bg-blue-600"
      />

      {/* Divider */}
      <div className="w-px bg-[#2a2a2a]"></div>

      {/* End Call Button */}
      <button
        onClick={endCall}
        className="bg-red-600 hover:bg-red-700 p-3 rounded-full transition-colors duration-200"
        title="End call"
      >
        <PhoneOff size={20} className="text-white" />
      </button>
    </div>
  );
}

const ControlButton = memo(
  ({ icon, onClick, active, title, activeColor = "bg-blue-600" }) => (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-colors duration-200 ${
        active ? activeColor : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
      }`}
      title={title}
    >
      <div className="text-white">{icon}</div>
    </button>
  )
);

ControlButton.displayName = "ControlButton";

export default memo(BottomControls);