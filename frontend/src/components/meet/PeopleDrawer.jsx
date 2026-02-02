// FIXED PeopleDrawer Component - Shows all participants
// File: frontend/components/meet/PeopleDrawer.jsx

import { X, Crown } from "lucide-react";
import { memo } from "react";
import { useMeeting } from "../../context/MeetingContext";

function PeopleDrawer() {
  const { participants, mySocketId, setActiveTab, localStream } = useMeeting();

  console.log("👥 PeopleDrawer Render:", {
    participantsCount: participants.length,
    mySocketId,
    hasLocalStream: !!localStream,
    participantsList: participants.map((p) => ({
      socketId: p.socketId,
      name: p.name,
      isHost: p.isHost,
    })),
  });

  // Include self in the display
  const allParticipants = [
    ...participants,
    // If we have local stream but not in participants list, add self
    ...(localStream && !participants.some((p) => p.socketId === mySocketId)
      ? [
          {
            socketId: mySocketId,
            name: "You",
            email: null,
            isHost: participants.find((p) => p.isHost)?.socketId === mySocketId,
            isSelf: true,
          },
        ]
      : []),
  ];

  // Remove duplicates by socketId
  const uniqueParticipants = Array.from(
    new Map(allParticipants.map((p) => [p.socketId, p])).values()
  );

  console.log("📊 Unique Participants:", {
    count: uniqueParticipants.length,
    list: uniqueParticipants.map((p) => p.name),
  });

  return (
    <div className="w-80 h-full bg-[#1f1f1f] border-l border-[#2a2a2a] flex flex-col">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-[#2a2a2a]">
        <span className="font-semibold text-white">
          Participants ({uniqueParticipants.length})
        </span>
        <button 
          onClick={() => setActiveTab(null)}
          className="hover:bg-[#2a2a2a] p-1 rounded transition-colors"
          title="Close"
        >
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {uniqueParticipants.length > 0 ? (
          uniqueParticipants.map((p) => {
            const name = p.isSelf ? "You" : p.name || p.user?.name || "User";
            const email = p.email || p.user?.email;
            const isHost = p.isHost === true;
            const isYou = p.socketId === mySocketId || p.isSelf;

            console.log(`👤 Participant:`, {
              name,
              isYou,
              isHost,
              socketId: p.socketId,
            });

            return (
              <div
                key={p.socketId || "self"}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                    isHost
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                      : isYou
                      ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                      : "bg-gradient-to-br from-gray-600 to-gray-700 text-gray-200"
                  }`}
                >
                  {name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {name}
                    </span>

                    {/* You Badge */}
                    {isYou && (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded font-medium flex-shrink-0">
                        You
                      </span>
                    )}

                    {/* Host Badge */}
                    {isHost && (
                      <span className="flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-medium flex-shrink-0">
                        <Crown size={12} />
                        Host
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  {email && (
                    <div className="text-xs text-gray-400 truncate mt-1">
                      {email}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Loading participants...
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-[#2a2a2a] text-xs text-gray-500">
        <div className="text-center">
          {uniqueParticipants.length} participant
          {uniqueParticipants.length !== 1 ? "s" : ""} in room
        </div>
      </div>
    </div>
  );
}

export default memo(PeopleDrawer);