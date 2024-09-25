import express from 'express';
import { WebSocketServer } from 'ws';
// import { RTCPeerConnection } from 'wrtc';
import { readFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';

const RTCPeerConnection = require('wrtc').RTCPeerConnection;
const app = express();
const port = 3000;

app.use(express.static('public'));

let recordedAudioData: string | null = null; 

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let peerConnection: RTCPeerConnection;

  ws.on('message', async (message) => {
    const signal = JSON.parse(message.toString());

    if (signal.type === 'offer') {
      // Create a new RTCPeerConnection
      peerConnection = new RTCPeerConnection();

      // Set remote description
      await peerConnection.setRemoteDescription(signal.sdp);

      // Create an answer and send it to the client
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      ws.send(JSON.stringify({ type: 'answer', sdp: peerConnection.localDescription }));
    }

    if (signal.type === 'audio') {
      // Store the base64-encoded audio data sent from the client
      recordedAudioData = signal.audioData;
      console.log('Audio received from client and stored.');
      if (recordedAudioData) {
        // Convert base64 audio data back to binary and store it in the public folder
        const audioBuffer = Buffer.from(recordedAudioData, 'base64');
        
        // Generate a unique filename
        const filePath = path.join(__dirname, 'public', 'recorded-audio.mp4');

        // Write the file to the public directory
        fs.writeFile(filePath, audioBuffer, (err) => {
          if (err) {
            console.error('Failed to save audio file:', err);
            return;
          }
          console.log(`Audio file saved at: ${filePath}`);
        });
      }
    }

    if (signal.type === 'play' && recordedAudioData) {
      // When the client requests playback, send the stored audio data
      ws.send(JSON.stringify({ type: 'playback', audioData: recordedAudioData }));
    }
  });
});