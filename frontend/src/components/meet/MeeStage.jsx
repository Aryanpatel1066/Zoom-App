import { memo, useMemo } from "react";
import { useMeeting } from "../../context/MeetingContext";

function MeetStage() {
  const { participants } = useMeeting();

  const gridCols = useMemo(() => {
    const count = participants.length;
    if (count <= 1) return "grid-cols-1";
    if (count <= 4) return "grid-cols-2";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  }, [participants.length]);
 
  return (
    <div className="flex-1 p-4">
      <div className={`grid ${gridCols} gap-3 h-full`}>
        {participants.map((p) => (
          <div key={p.socketId} className="bg-zinc-900 rounded-xl relative">
            <video autoPlay muted className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 text-white">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(MeetStage);
