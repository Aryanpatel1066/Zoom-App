import { MeetingProvider } from "../context/MeetingContext";
import MeetStage from "../components/meet/MeeStage";
import BottomControls from "../components/meet/BottomControls";
import ChatDrawer from "../components/meet/ChatDrawer";
import PeopleDrawer from "../components/meet/PeopleDrawer";
import { useMeeting } from "../context/MeetingContext";

function RoomUI() {
  const { activeTab } = useMeeting();

  return (
    <div className="h-screen flex bg-black relative overflow-hidden">
      <MeetStage />

      {activeTab === "chat" && <ChatDrawer />}
      {activeTab === "people" && <PeopleDrawer />}

      <BottomControls />
    </div>
  );
}

export default function Room() {
  return (
    <MeetingProvider>
      <RoomUI />
    </MeetingProvider>
  );
}
