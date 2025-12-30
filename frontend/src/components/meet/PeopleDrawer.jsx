import { X, Crown } from "lucide-react";
import { memo } from "react";
import { useMeeting } from "../../context/MeetingContext";

function PeopleDrawer() {
  const { participants, mySocketId, setActiveTab } = useMeeting();

  return (
    <div className="w-80 h-full bg-[#1f1f1f] border-l border-[#2a2a2a] flex flex-col">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-[#2a2a2a]">
        <span className="font-semibold text-white">
          Participants ({participants.length})
        </span>
        <button onClick={() => setActiveTab(null)}>
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {participants.map((p) => {
          const name = p.name || p.user?.name || "User";
          const email = p.email || p.user?.email;
          const isHost = p.isHost === true;
          const isYou = p.socketId === mySocketId;

          return (
            <div key={p.socketId} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${
                    isHost
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-200"
                  }`}
              >
                {name.charAt(0)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">{name}</span>

                  {/* {isYou && (
                    <span className="text-xs text-green-400">(You)</span>
                  )} */}
                  {isYou && (
                    <span className="text-xs text-green-400">(You)</span>
                  )}

                  {isHost && (
                    <span className="flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                      <Crown size={12} />
                      Host
                    </span>
                  )}
                </div>

                {email && <div className="text-xs text-gray-400">{email}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(PeopleDrawer);
