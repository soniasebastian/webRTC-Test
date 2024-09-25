"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const RTCPeerConnection = require('wrtc').RTCPeerConnection;
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.static('public'));
let recordedAudioData = null;
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
const wss = new ws_1.WebSocketServer({ server });
wss.on('connection', (ws) => {
    let peerConnection;
    ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
        const signal = JSON.parse(message.toString());
        if (signal.type === 'offer') {
            // Create a new RTCPeerConnection
            peerConnection = new RTCPeerConnection();
            // Set remote description
            yield peerConnection.setRemoteDescription(signal.sdp);
            // Create an answer and send it to the client
            const answer = yield peerConnection.createAnswer();
            yield peerConnection.setLocalDescription(answer);
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
                const filePath = path_1.default.join(__dirname, 'public', 'recorded-audio.mp4');
                // Write the file to the public directory
                fs_1.default.writeFile(filePath, audioBuffer, (err) => {
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
    }));
});
