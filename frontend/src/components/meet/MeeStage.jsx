 export default function MeetStage({ participants }) {
  const getGridCols = (count) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
<div className="flex-1 p-4 border-4 min-h-0 border-blue-500">
      <div
        className={`
          w-full h-full min-h-0
          grid gap-3
          ${getGridCols(participants.length)}
        `}
      >
        {participants.map((p) => (
          <div
            key={p.socketId}
            className="relative bg-zinc-900  rounded-xl overflow-hidden flex items-center justify-center    border border-white/10
"
          >
            {/* VIDEO STREAM (attach WebRTC later) */}
            <video
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* USER NAME */}
            <div className="absolute bottom-2 left-2
              bg-black/60 text-white text-sm px-2 py-1 rounded">
              {p.name}
              {p.isHost && " 👑"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
