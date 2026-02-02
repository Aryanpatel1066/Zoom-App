// Enhanced MeetStage Component with Video Grid
// File: frontend/components/meet/MeetStage.jsx

import { memo, useEffect, useRef, useMemo } from "react";
import { useMeeting } from "../../context/MeetingContext";

function MeetStage() {
  const {
    participants,
    mySocketId,
    localStream,
    remoteStreams,
    micOn,
    camOn,
    connecting,
  } = useMeeting();

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  // Calculate grid columns based on participant count
  const gridCols = useMemo(() => {
    const count = participants.length + (localStream ? 1 : 0);
    if (count <= 1) return "grid-cols-1";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  }, [participants.length, localStream]);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("✅ Local video stream attached to video element");
    }
  }, [localStream]);

  // Update remote video streams
  useEffect(() => {
    remoteStreams.forEach((stream, peerId) => {
      let videoRef = remoteVideoRefs.current.get(peerId);
      if (!videoRef) {
        videoRef = document.createElement("video");
        remoteVideoRefs.current.set(peerId, videoRef);
      }
      if (videoRef) {
        videoRef.srcObject = stream;
        console.log(`✅ Remote video stream attached for peer: ${peerId}`);
      }
    });

    // Cleanup removed peers
    for (const [peerId, videoRef] of remoteVideoRefs.current.entries()) {
      if (!remoteStreams.has(peerId)) {
        if (videoRef.srcObject) {
          videoRef.srcObject.getTracks().forEach(track => track.stop());
        }
        remoteVideoRefs.current.delete(peerId);
      }
    }
  }, [remoteStreams]);

  // Get participant info
  const getParticipantInfo = (socketId) => {
    const participant = participants.find(p => p.socketId === socketId);
    return {
      name: participant?.name || "User",
      isHost: participant?.isHost || false,
      audio: participant?.mediaStatus?.audio ?? true,
      video: participant?.mediaStatus?.video ?? true,
    };
  };

  if (connecting) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="mt-4 text-lg font-semibold">Setting up your camera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 bg-black overflow-auto">
      <div className={`grid ${gridCols} gap-3 h-full auto-rows-fr`}>
        {/* LOCAL VIDEO */}
        {localStream && (
          <VideoTile
            ref={localVideoRef}
            name="You"
            isLocal={true}
            audioEnabled={micOn}
            videoEnabled={camOn}
            isHost={participants.find(p => p.socketId === mySocketId)?.isHost}
          />
        )}

        {/* REMOTE VIDEOS */}
        {participants.map((participant) => {
          if (participant.socketId === mySocketId) return null;

          const stream = remoteStreams.get(participant.socketId);
          const info = getParticipantInfo(participant.socketId);

          return (
            <RemoteVideoTile
              key={participant.socketId}
              peerId={participant.socketId}
              name={info.name}
              stream={stream}
              audioEnabled={info.audio}
              videoEnabled={info.video}
              isHost={info.isHost}
              remoteVideoRefs={remoteVideoRefs}
            />
          );
        })}
      </div>
    </div>
  );
}

// Local Video Tile Component
const VideoTile = memo(
  React.forwardRef(
    ({ name, isLocal, audioEnabled, videoEnabled, isHost }, ref) => (
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center h-full">
        {videoEnabled ? (
          <video
            ref={ref}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-6xl text-gray-500">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Info Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <div className="text-white text-sm font-medium bg-black/60 px-2 py-1 rounded">
            {name}
            {isLocal && " (You)"}
          </div>
        </div>

        {/* Media Status Indicators */}
        <div className="absolute top-2 right-2 flex gap-2">
          {!audioEnabled && (
            <div className="bg-red-600 p-2 rounded-full">
              <span className="text-white text-xs">🔇</span>
            </div>
          )}
          {!videoEnabled && (
            <div className="bg-red-600 p-2 rounded-full">
              <span className="text-white text-xs">📹</span>
            </div>
          )}
          {isHost && (
            <div className="bg-blue-600 p-2 rounded-full">
              <span className="text-white text-xs">👑</span>
            </div>
          )}
        </div>

        {/* Connection State */}
        <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-transparent"></div>
      </div>
    )
  )
);

VideoTile.displayName = "VideoTile";

// Remote Video Tile Component
const RemoteVideoTile = memo(
  ({
    peerId,
    name,
    stream,
    audioEnabled,
    videoEnabled,
    isHost,
    remoteVideoRefs,
  }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center h-full">
        {videoEnabled && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-6xl text-gray-500">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Info Overlay */}
        <div className="absolute bottom-2 left-2">
          <div className="text-white text-sm font-medium bg-black/60 px-2 py-1 rounded">
            {name}
          </div>
        </div>

        {/* Media Status Indicators */}
        <div className="absolute top-2 right-2 flex gap-2">
          {!audioEnabled && (
            <div className="bg-red-600 p-2 rounded-full">
              <span className="text-white text-xs">🔇</span>
            </div>
          )}
          {!videoEnabled && (
            <div className="bg-red-600 p-2 rounded-full">
              <span className="text-white text-xs">📹</span>
            </div>
          )}
          {isHost && (
            <div className="bg-blue-600 p-2 rounded-full">
              <span className="text-white text-xs">👑</span>
            </div>
          )}
        </div>

        {/* Loading state when stream not yet received */}
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-white text-center">
              <div className="animate-pulse text-sm">Connecting...</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

RemoteVideoTile.displayName = "RemoteVideoTile";

export default memo(MeetStage);