import { X } from "lucide-react";
import { memo } from "react";
import { useMeeting } from "../../context/MeetingContext";

function ChatDrawer() {
  const { messages, text, setText, sendMessage, messagesRef, setActiveTab } =
    useMeeting();

  return (
    <div className="w-80 h-full bg-[#1f1f1f] flex flex-col border-l border-[#2a2a2a]">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-[#2a2a2a] text-white">
        <span className="font-semibold">Meeting chat</span>
        <button onClick={() => setActiveTab(null)}>
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => {
          const senderName =
            m.sender?.name || m.senderName || m.sender?.user?.name || "User";

          return (
            <div key={i}>
              <p className="text-xs font-medium text-gray-400">{senderName}</p>
              <p className="text-sm text-white break-words">{m.text}</p>
            </div>
          );
        })}

        {/* Auto scroll anchor */}
        <div ref={messagesRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t border-[#2a2a2a]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Send a message"
          className="
            w-full bg-[#2a2a2a] text-white
            px-3 py-2 rounded outline-none
            placeholder-gray-400
          "
        />
      </div>
    </div>
  );
}

export default memo(ChatDrawer);
