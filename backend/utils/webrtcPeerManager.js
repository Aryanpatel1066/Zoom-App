// WebRTC Peer Connection Manager for Mesh Topology
// File: backend/utils/webrtcPeerManager.js

class WebRTCPeerManager {
  constructor() {
    this.peers = new Map(); // socketId -> RTCPeerConnection
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ];
  }

  // Create peer connection for a specific socket
  createPeerConnection(socketId, onIceCandidate, onTrackReceived) {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(socketId, event.candidate);
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      onTrackReceived(socketId, event.stream);
    };

    // Connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${socketId}: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        this.closePeerConnection(socketId);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${socketId}: ${peerConnection.iceConnectionState}`);
    };

    this.peers.set(socketId, peerConnection);
    return peerConnection;
  }

  // Get or create peer connection
  getPeerConnection(socketId) {
    return this.peers.get(socketId);
  }

  // Close specific peer connection
  closePeerConnection(socketId) {
    const peer = this.peers.get(socketId);
    if (peer) {
      peer.close();
      this.peers.delete(socketId);
      console.log(`Closed peer connection with ${socketId}`);
    }
  }

  // Close all peer connections
  closeAllConnections() {
    for (const [socketId, peer] of this.peers.entries()) {
      peer.close();
      this.peers.delete(socketId);
    }
    console.log('Closed all peer connections');
  }

  // Add local stream to all peers
  async addLocalStreamToPeers(stream) {
    for (const [socketId, peerConnection] of this.peers.entries()) {
      try {
        // Remove existing tracks
        peerConnection.getSenders().forEach(sender => {
          peerConnection.removeTrack(sender);
        });

        // Add new tracks
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      } catch (err) {
        console.error(`Error adding stream to peer ${socketId}:`, err);
      }
    }
  }

  // Get all peer connection IDs
  getPeerIds() {
    return Array.from(this.peers.keys());
  }

  // Get peer statistics
  async getPeerStats(socketId) {
    const peer = this.peers.get(socketId);
    if (!peer) return null;

    const stats = await peer.getStats();
    const report = {
      inbound: {},
      outbound: {},
    };

    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        report.inbound = {
          bytesReceived: report.bytesReceived,
          packetsReceived: report.packetsReceived,
          packetsLost: report.packetsLost,
          jitter: report.jitter,
          frameWidth: report.frameWidth,
          frameHeight: report.frameHeight,
          framesDecoded: report.framesDecoded,
        };
      }
      if (report.type === 'outbound-rtp') {
        report.outbound = {
          bytesSent: report.bytesSent,
          packetsSent: report.packetsSent,
          frameWidth: report.frameWidth,
          frameHeight: report.frameHeight,
          framesEncoded: report.framesEncoded,
        };
      }
    });

    return report;
  }
}

export default WebRTCPeerManager;