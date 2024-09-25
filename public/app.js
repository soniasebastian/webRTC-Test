let localStream;
let peerConnection;
const ws = new WebSocket(`ws://${window.location.host}`);

document.getElementById('callButton').addEventListener('click', async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  peerConnection = new RTCPeerConnection();
  
  // Add local audio track to the peer connection
  localStream.getTracks().forEach((track) => {
    if (peerConnection.signalingState !== "closed") {
      peerConnection.addTrack(track, localStream);
    }
  });

  // Create an offer and send it to the server
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  ws.send(JSON.stringify(offer));
});

document.getElementById('disconnectButton').addEventListener('click', () => {
  if (peerConnection) {
    peerConnection.close();
    ws.send(JSON.stringify({ type: 'disconnect' }));
  }
});

document.getElementById('playButton').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'play' }));
});

ws.onmessage = async (message) => {
  const signal = JSON.parse(message.data);

  if (signal.type === 'answer') {
    await peerConnection.setRemoteDescription(signal);
  } else if (signal.type === 'audio') {
    // Create an audio element and play the received audio
    const audio = new Audio(signal.audioUrl);
    audio.play();
  }
};
