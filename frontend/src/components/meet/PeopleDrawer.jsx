 import { X, Crown } from "lucide-react";

export default function PeopleDrawer({ participants, onClose }) {
  return (
    <div className="
      w-80 h-full bg-[#1f1f1f]
      border-l border-[#2a2a2a]
      flex flex-col animate-slideIn
    ">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-[#2a2a2a]">
        <span className="font-semibold">
          Participants ({participants.length})
        </span>
        <button onClick={onClose}>
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {participants.map((p, i) => {
          const name = p.name || p.user?.name || "User";
          const email = p.email || p.user?.email;
          const isHost = p.isHost === true; // ONLY CREATOR

          return (
            <div
              key={p.userId || i}
              className="flex items-center gap-3"
            >
              {/* AVATAR */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-semibold uppercase
                  ${isHost ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-200"}
                `}
              >
                {name.charAt(0)}
              </div>

              {/* INFO */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      text-sm font-medium
                      ${isHost ? "text-white" : "text-gray-300"}
                    `}
                  >
                    {name}
                  </span>

                  {isHost && (
                    <span className="
                      flex items-center gap-1
                      text-xs bg-blue-600/20 text-blue-400
                      px-2 py-0.5 rounded
                    ">
                      <Crown size={12} />
                      Host
                    </span>
                  )}
                </div>

                {email && (
                  <div className="text-xs text-gray-400">
                    {email}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
