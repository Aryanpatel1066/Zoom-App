 import { X } from "lucide-react";

export default function ChatDrawer({
  messages,
  text,
  setText,
  sendMessage,
  messagesRef,
  onClose
}) {
  return (
    <div className="
      w-80 h-full bg-[#1f1f1f] flex flex-col
      border-l border-[#2a2a2a]
      animate-slideIn
    ">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-[#2a2a2a]">
        <span className="font-semibold">Meeting chat</span>
        <button onClick={onClose}>
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i}>
            <p className="text-xs text-gray-400">
              {m.sender?.name || m.senderName || "User"}
            </p>
            <p className="text-sm">{m.text}</p>
          </div>
        ))}
        <div ref={messagesRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t border-[#2a2a2a]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Send a message"
          className="w-full bg-[#2a2a2a] px-3 py-2 rounded outline-none"
        />
      </div>
    </div>
  );
}
