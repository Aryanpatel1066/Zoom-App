import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Users,
  PhoneOff,
} from "lucide-react";
import { useState, memo } from "react";
import { useMeeting } from "../../context/MeetingContext";

function BottomControls() {
  const { activeTab, setActiveTab, endCall } = useMeeting();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleTab = (tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1f1f1f] px-6 py-3 rounded-full flex gap-4">
      <ControlButton
        active={micOn}
        onClick={() => setMicOn(!micOn)}
        icon={micOn ? <Mic /> : <MicOff />}
      />
      <ControlButton
        active={camOn}
        onClick={() => setCamOn(!camOn)}
        icon={camOn ? <Video /> : <VideoOff />}
      />
      <ControlButton
        active={activeTab === "chat"}
        onClick={() => toggleTab("chat")}
        icon={<MessageSquare />}
      />
      <ControlButton
        active={activeTab === "people"}
        onClick={() => toggleTab("people")}
        icon={<Users />}
      />

      <button onClick={endCall} className="bg-red-600 p-3 rounded-full">
        <PhoneOff />
      </button>
    </div>
  );
}

const ControlButton = memo(({ icon, onClick, active }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-full ${active ? "bg-blue-600" : "bg-[#2a2a2a]"}`}
  >
    {icon}
  </button>
));

export default memo(BottomControls);
