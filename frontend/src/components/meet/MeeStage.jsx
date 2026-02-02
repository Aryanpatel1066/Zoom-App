// COMPLETELY FIXED MeetStage Component - Remote videos working
// File: frontend/components/meet/MeetStage.jsx

import React, { memo, useEffect, useRef, useMemo, useState } from "react";
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
  const [remoteStreamsList, setRemoteStreamsList] = useState([]);

  console.log("🎬 MeetStage Debug:", {
    mySocketId,
    localStreamReady: !!localStream,
    participantsTotal: participants.length,
    remoteStreamsMapSize: remoteStreams.size,
    remoteStreamsList: remoteStreamsList.length,
    participantIds: participants.map((p) => p.socketId),
    remoteStreamIds: Array.from(remoteStreams.keys()),
  });

  // Update remote streams list whenever remoteStreams map changes
  useEffect(() => {
    const streamsList = Array.from(remoteStreams.entries()).map(([peerId, stream]) => ({
      peerId,
      stream,
    }));
    setRemoteStreamsList(streamsList);
    console.log("📊 Updated remote streams list:", streamsList.length);
  }, [remoteStreams]);

  // Attach local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("✅ Local video attached");
    }
  }, [localStream]);

  // Calculate grid layout
  const totalSlots = 1 + remoteStreamsList.length; // 1 for local
  const gridCols = useMemo(() => {
    if (totalSlots <= 1) return "grid-cols-1";
    if (totalSlots <= 2) return "grid-cols-2";
    if (totalSlots <= 4) return "grid-cols-2";
    if (totalSlots <= 6) return "grid-cols-3";
    if (totalSlots <= 9) return "grid-cols-3";
    return "grid-cols-4";
  }, [totalSlots]);

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

  if (connecting) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="inline-block mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="text-lg font-semibold">Setting up your camera...</p>
          {connectionError && <p className="mt-2 text-sm text-red-400">{connectionError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 bg-black overflow-auto flex flex-col">
      {connectionError && (
        <div className="mb-3 bg-red-600/20 border border-red-600 text-red-400 px-3 py-2 rounded text-sm">
          {connectionError}
        </div>
      )}

      {/* Main Grid */}
      <div className={`grid ${gridCols} gap-2 flex-1 auto-rows-fr`}>
        {/* LOCAL VIDEO - Always shown first */}
        {localStream && (
          <VideoTile
            ref={localVideoRef}
            name="You"
            isLocal={true}
            audioEnabled={micOn}
            videoEnabled={camOn}
            isHost={participants.find((p) => p.socketId === mySocketId)?.isHost}
            isYou={true}
          />
        )}

        {/* REMOTE VIDEOS - From remoteStreams map */}
        {remoteStreamsList.length > 0 ? (
          remoteStreamsList.map(({ peerId, stream }) => {
            const info = getParticipantInfo(peerId);
            return (
              <RemoteVideoTile
                key={peerId}
                peerId={peerId}
                name={info.name}
                stream={stream}
                audioEnabled={info.audio}
                videoEnabled={info.video}
                isHost={info.isHost}
              />
            );
          })
        ) : (
          <div className="col-span-full flex items-center justify-center text-gray-400 text-center py-8">
            <div>
              <p className="text-lg mb-2">👥</p>
              <p>Waiting for other participants to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Footer */}
      <div className="mt-2 text-xs text-gray-500 text-center space-y-1">
        <div>Total: {totalSlots} participant{totalSlots !== 1 ? "s" : ""}</div>
        <div>Remote streams: {remoteStreamsList.length}</div>
        <div>Local stream: {localStream ? "✅" : "❌"}</div>
      </div>
    </div>
  );
}

// Local Video Component
const VideoTile = memo(
  React.forwardRef(
    ({ name, isLocal, audioEnabled, videoEnabled, isHost, isYou }, ref) => (
      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden flex items-center justify-center h-full shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
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
              <div className="text-5xl font-bold text-gray-600 mb-2">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs text-gray-400">{name}</div>
            </div>
          </div>
        )}

        {/* Name Badge */}
        <div className="absolute bottom-2 left-2 z-20">
          <div className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
            {name}
            {isYou && " (You)"}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {!audioEnabled && (
            <div className="bg-red-600/80 hover:bg-red-700 p-1.5 rounded-full" title="Microphone muted">
              <span className="text-white text-xs">🔇</span>
            </div>
          )}
          {!videoEnabled && (
            <div className="bg-red-600/80 hover:bg-red-700 p-1.5 rounded-full" title="Camera off">
              <span className="text-white text-xs">📹</span>
            </div>
          )}
          {isHost && (
            <div className="bg-blue-600/80 hover:bg-blue-700 p-1.5 rounded-full" title="Host">
              <span className="text-white text-xs">👑</span>
            </div>
          )}
        </div>
      </div>
    )
  )
);

VideoTile.displayName = "VideoTile";

// Remote Video Component
const RemoteVideoTile = memo(({ peerId, name, stream, audioEnabled, videoEnabled, isHost }) => {
  const videoRef = useRef(null);
  const [streamReady, setStreamReady] = useState(!!stream);

  useEffect(() => {
    console.log(`🎥 Setting remote video for ${name} (${peerId}):`, {
      hasStream: !!stream,
      videoReady: videoRef.current ? "yes" : "no",
    });

    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      setStreamReady(true);
    } else {
      setStreamReady(false);
    }
  }, [stream, peerId, name]);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden flex items-center justify-center h-full shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
      {streamReady && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          onLoadedMetadata={() => {
            console.log(`✅ Remote video metadata loaded: ${name}`);
          }}
          onPlay={() => {
            console.log(`▶️ Remote video playing: ${name}`);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-600 mb-2">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs text-gray-400">{name}</div>
          </div>
        </div>
      )}

      {/* Name Badge */}
      <div className="absolute bottom-2 left-2 z-20">
        <div className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
          {name}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        {!audioEnabled && (
          <div className="bg-red-600/80 hover:bg-red-700 p-1.5 rounded-full" title="Microphone muted">
            <span className="text-white text-xs">🔇</span>
          </div>
        )}
        {!videoEnabled && (
          <div className="bg-red-600/80 hover:bg-red-700 p-1.5 rounded-full" title="Camera off">
            <span className="text-white text-xs">📹</span>
          </div>
        )}
        {isHost && (
          <div className="bg-blue-600/80 hover:bg-blue-700 p-1.5 rounded-full" title="Host">
            <span className="text-white text-xs">👑</span>
          </div>
        )}
      </div>

      {/* Connecting State */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="text-center">
            <div className="animate-bounce mb-2">📡</div>
            <div className="text-white text-xs">Connecting...</div>
          </div>
        </div>
      )}
    </div>
  );
});

RemoteVideoTile.displayName = "RemoteVideoTile";

export default memo(MeetStage);