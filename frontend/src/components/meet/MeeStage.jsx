// FIXED MeetStage Component - Properly displays all participants
// File: frontend/components/meet/MeetStage.jsx

import React, { memo, useEffect, useRef, useMemo } from "react";
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
    connectionError,
  } = useMeeting();

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  console.log("🎬 MeetStage Render:", {
    localStreamActive: !!localStream,
    participantsCount: participants.length,
    remoteStreamsCount: remoteStreams.size,
    mySocketId,
  });

  // Calculate grid columns based on total participant count (including self)
  const totalParticipants = participants.length + (localStream ? 1 : 0);
  const gridCols = useMemo(() => {
    if (totalParticipants <= 1) return "grid-cols-1";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-3";
    if (totalParticipants <= 9) return "grid-cols-3";
    return "grid-cols-4";
  }, [totalParticipants]);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("✅ Local video stream attached");
    }
  }, [localStream]);

  // Update remote video streams
  useEffect(() => {
    console.log("🔄 Updating remote video streams:", {
      remoteStreamsCount: remoteStreams.size,
      keys: Array.from(remoteStreams.keys()),
    });

    remoteStreams.forEach((stream, peerId) => {
      let videoElement = remoteVideoRefs.current.get(peerId);
      
      if (!videoElement) {
        videoElement = document.createElement("video");
        videoElement.autoplay = true;
        videoElement.playsinline = true;
        remoteVideoRefs.current.set(peerId, videoElement);
      }

      if (videoElement && stream) {
        videoElement.srcObject = stream;
        console.log(`✅ Remote video attached for peer: ${peerId}`);
      }
    });

    // Cleanup removed peers
    const peersToRemove = [];
    for (const peerId of remoteVideoRefs.current.keys()) {
      if (!remoteStreams.has(peerId)) {
        peersToRemove.push(peerId);
      }
    }

    peersToRemove.forEach((peerId) => {
      const videoElement = remoteVideoRefs.current.get(peerId);
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
      }
      remoteVideoRefs.current.delete(peerId);
      console.log(`🔌 Removed video for peer: ${peerId}`);
    });
  }, [remoteStreams]);

  // Get participant info
  const getParticipantInfo = (socketId) => {
    const participant = participants.find((p) => p.socketId === socketId);
    return {
      name: participant?.name || "User",
      isHost: participant?.isHost || false,
      audio: participant?.mediaStatus?.audio ?? true,
      video: participant?.mediaStatus?.video ?? true,
    };
  };

  // Loading state
  if (connecting) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="mt-4 text-lg font-semibold">Setting up your camera...</p>
          {connectionError && (
            <p className="mt-2 text-sm text-red-400">{connectionError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 bg-black overflow-auto">
      {connectionError && (
        <div className="absolute top-4 right-4 bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded">
          {connectionError}
        </div>
      )}

      <div className={`grid ${gridCols} gap-3 h-full auto-rows-fr`}>
        {/* LOCAL VIDEO */}
        {localStream && (
          <VideoTile
            ref={localVideoRef}
            name="You"
            isLocal={true}
            audioEnabled={micOn}
            videoEnabled={camOn}
            isHost={participants.find((p) => p.socketId === mySocketId)?.isHost}
          />
        )}

        {/* REMOTE VIDEOS */}
        {participants.length > 0 ? (
          participants.map((participant) => {
            // Don't show self twice
            if (participant.socketId === mySocketId) return null;

            const stream = remoteStreams.get(participant.socketId);
            const info = getParticipantInfo(participant.socketId);

            console.log(`🎥 Rendering remote video for ${info.name}:`, {
              hasStream: !!stream,
              socketId: participant.socketId,
            });

            return (
              <RemoteVideoTile
                key={participant.socketId}
                peerId={participant.socketId}
                name={info.name}
                stream={stream}
                audioEnabled={info.audio}
                videoEnabled={info.video}
                isHost={info.isHost}
              />
            );
          })
        ) : (
          <div className="col-span-full flex items-center justify-center text-gray-400">
            <p>Waiting for other participants to join...</p>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="absolute bottom-20 left-4 text-xs text-gray-500 max-w-xs">
        <div>Total: {totalParticipants} participants</div>
        <div>Remote streams: {remoteStreams.size}</div>
        <div>Local stream: {localStream ? "✅" : "❌"}</div>
      </div>
    </div>
  );
}

// Local Video Tile Component
const VideoTile = memo(
  React.forwardRef(
    ({ name, isLocal, audioEnabled, videoEnabled, isHost }, ref) => (
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center h-full shadow-lg border border-zinc-800">
        {videoEnabled ? (
          <video
            ref={ref}
            autoPlay
            muted={isLocal}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-600 mb-2">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm text-gray-400">{name}</div>
            </div>
          </div>
        )}

        {/* Info Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 z-10">
          <div className="text-white text-xs font-medium bg-black/70 px-2 py-1 rounded">
            {name}
            {isLocal && " (You)"}
          </div>
        </div>

        {/* Media Status Indicators */}
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {!audioEnabled && (
            <div className="bg-red-600/80 p-2 rounded-full tooltip" title="Muted">
              <span className="text-white text-xs">🔇</span>
            </div>
          )}
          {!videoEnabled && (
            <div className="bg-red-600/80 p-2 rounded-full tooltip" title="Camera off">
              <span className="text-white text-xs">📹</span>
            </div>
          )}
          {isHost && (
            <div className="bg-blue-600/80 p-2 rounded-full tooltip" title="Host">
              <span className="text-white text-xs">👑</span>
            </div>
          )}
        </div>
      </div>
    )
  )
);

VideoTile.displayName = "VideoTile";

// Remote Video Tile Component
const RemoteVideoTile = memo(({ peerId, name, stream, audioEnabled, videoEnabled, isHost }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      console.log(`✅ Remote video element set for ${peerId}`);
    }
  }, [stream, peerId]);

  return (
    <div className="relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center h-full shadow-lg border border-zinc-800">
      {videoEnabled && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-600 mb-2">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm text-gray-400">{name}</div>
          </div>
        </div>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-2 left-2 z-10">
        <div className="text-white text-xs font-medium bg-black/70 px-2 py-1 rounded">
          {name}
        </div>
      </div>

      {/* Media Status Indicators */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {!audioEnabled && (
          <div className="bg-red-600/80 p-2 rounded-full tooltip" title="Muted">
            <span className="text-white text-xs">🔇</span>
          </div>
        )}
        {!videoEnabled && (
          <div className="bg-red-600/80 p-2 rounded-full tooltip" title="Camera off">
            <span className="text-white text-xs">📹</span>
          </div>
        )}
        {isHost && (
          <div className="bg-blue-600/80 p-2 rounded-full tooltip" title="Host">
            <span className="text-white text-xs">👑</span>
          </div>
        )}
      </div>

      {/* Loading state when stream not yet received */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-5">
          <div className="text-white text-center">
            <div className="animate-pulse">
              <div className="text-xl mb-2">📡</div>
              <div className="text-xs">Connecting...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RemoteVideoTile.displayName = "RemoteVideoTile";

export default memo(MeetStage);