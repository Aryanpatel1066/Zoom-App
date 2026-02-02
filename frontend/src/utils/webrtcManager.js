// Frontend WebRTC Manager for Mesh Topology
// File: frontend/utils/webrtcManager.js

class WebRTCManager {
  constructor(socket) {
    this.socket = socket;
    this.localStream = null;
    this.peers = new Map(); // peerId -> { peerConnection, stream, videoElement }
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ];
    this.peerConfig = {
      iceServers: this.iceServers,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };
    this.mediaConstraints = {
      audio: { echoCancellation: true, noiseSuppression: true },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    };
    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
  }

  // Get user media (audio + video)
  async getLocalStream() {
    try {
      const constraints = {
        audio: this.isAudioEnabled ? this.mediaConstraints.audio : false,
        video: this.isVideoEnabled ? this.mediaConstraints.video : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Local stream acquired:', this.localStream.getTracks());
      return this.localStream;
    } catch (err) {
      console.error('❌ Failed to get user media:', err);
      throw err;
    }
  }

  // Create peer connection with a remote peer
  createPeerConnection(peerId, onTrackReceived) {
    try {
      const peerConnection = new RTCPeerConnection(this.peerConfig);

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('webrtc-ice-candidate', {
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log('🎥 Received track from', peerId, event.track.kind);
        const remoteStream = event.streams[0];
        if (onTrackReceived) {
          onTrackReceived(peerId, remoteStream);
        }
        this.updatePeerStream(peerId, remoteStream);
      };

      // Connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${peerId}: ${peerConnection.connectionState}`);
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
          this.closePeerConnection(peerId);
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE state with ${peerId}: ${peerConnection.iceConnectionState}`);
      };

      peerConnection.onicegatheringstatechange = () => {
        console.log(`ICE gathering state with ${peerId}: ${peerConnection.iceGatheringState}`);
      };

      this.peers.set(peerId, { peerConnection, stream: null });
      return peerConnection;
    } catch (err) {
      console.error('❌ Error creating peer connection:', err);
      throw err;
    }
  }

  // Create and send offer to peer
  async createAndSendOffer(peerId) {
    try {
      const peerConnection = this.peers.get(peerId)?.peerConnection;
      if (!peerConnection) {
        throw new Error(`Peer connection not found for ${peerId}`);
      }

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.setLocalDescription(offer);
      this.socket.emit('webrtc-offer', { to: peerId, offer });

      console.log(`📤 Offer sent to ${peerId}`);
    } catch (err) {
      console.error('❌ Error creating/sending offer:', err);
      throw err;
    }
  }

  // Handle incoming offer
  async handleOffer(peerId, offer) {
    try {
      let peerConnection = this.peers.get(peerId)?.peerConnection;

      if (!peerConnection) {
        peerConnection = this.createPeerConnection(peerId);
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.socket.emit('webrtc-answer', { to: peerId, answer });
      console.log(`📤 Answer sent to ${peerId}`);
    } catch (err) {
      console.error('❌ Error handling offer:', err);
      throw err;
    }
  }

  // Handle incoming answer
  async handleAnswer(peerId, answer) {
    try {
      const peerConnection = this.peers.get(peerId)?.peerConnection;
      if (!peerConnection) {
        throw new Error(`Peer connection not found for ${peerId}`);
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`✅ Answer received from ${peerId}`);
    } catch (err) {
      console.error('❌ Error handling answer:', err);
      throw err;
    }
  }

  // Handle ICE candidate
  async handleICECandidate(peerId, candidate) {
    try {
      const peerConnection = this.peers.get(peerId)?.peerConnection;
      if (!peerConnection) {
        console.warn(`Peer connection not found for ${peerId} when adding ICE candidate`);
        return;
      }

      if (candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('❌ Error adding ICE candidate:', err);
    }
  }

  // Update peer stream
  updatePeerStream(peerId, stream) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.stream = stream;
    }
  }

  // Get peer stream
  getPeerStream(peerId) {
    return this.peers.get(peerId)?.stream || null;
  }

  // Toggle audio
  toggleAudio(enable) {
    this.isAudioEnabled = enable;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  }

  // Toggle video
  toggleVideo(enable) {
    this.isVideoEnabled = enable;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  }

  // Close peer connection
  closePeerConnection(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.peerConnection.close();
      this.peers.delete(peerId);
      console.log(`🔌 Closed connection with ${peerId}`);
    }
  }

  // Close all connections
  closeAllConnections() {
    for (const [peerId, peer] of this.peers.entries()) {
      peer.peerConnection.close();
      this.peers.delete(peerId);
    }
    console.log('🔌 Closed all peer connections');
  }

  // Stop local stream
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      console.log('⏹️ Local stream stopped');
    }
  }

  // Get all peers
  getAllPeers() {
    return Array.from(this.peers.keys());
  }

  // Get peer count
  getPeerCount() {
    return this.peers.size;
  }
}

export default WebRTCManager;