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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketManager = void 0;
const RecordAudio_1 = require("./RecordAudio");
const stopTimeoutInMs = 20000;
class WebsocketManager {
    // Constructor
    constructor(onResult, webSocketURL, language, callKey, hotwords, onStop, manualPunctuation) {
        this.paused = false;
        this.starting = false;
        this.stopping = false;
        this.onResult = onResult;
        this.webSocketURL = webSocketURL;
        this.language = language;
        this.callKey = callKey;
        this.hotwords = hotwords;
        this.onStop = onStop;
        this.manualPunctuation = manualPunctuation;
    }
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // This is the Base64 string
                // @ts-ignore
                const base64String = reader.result.split(",")[1]; // Split the string on ',' and get the second part
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            };
            if (this.starting) {
                return false;
            }
            try {
                this.starting = true;
                this.mediaStream = yield navigator.mediaDevices.getUserMedia(constraints);
                this.audioRecorder = new RecordAudio_1.RecordAudio(this.mediaStream, (blob) => {
                    this.finalBlob = blob;
                });
                this.audioSocket = new WebSocket(this.webSocketURL);
                this.audioSocket.binaryType = "blob";
                this.audioSocket.onopen = () => {
                    if (this.audioSocket) {
                        this.audioSocket.send(JSON.stringify({
                            language: this.language,
                            hotwords: this.hotwords.join(","),
                            manual_punctuation: this.manualPunctuation,
                        }));
                    }
                };
                this.audioSocket.onclose = (event) => {
                    console.log("WebSocket closed:", event);
                };
                this.audioSocket.onerror = (event) => {
                    console.log("WebSocket error:", event);
                    // handle error here
                };
                this.audioSocket.onmessage = (event) => {
                    var _a;
                    const message = JSON.parse(event.data);
                    if ("finished" in message) {
                        if (this.audioSocket) {
                            this.audioSocket.close();
                            this.audioSocket = undefined;
                        }
                        // Remove timeout if it exists
                        if (this.closeTimeout) {
                            clearTimeout(this.closeTimeout);
                        }
                        // Call onStop
                        if (this.finalBlob) {
                            this.onStop(this.finalBlob, this.callKey);
                        }
                        else {
                            console.log("No final blob: should not happen");
                            // Send empty blob
                            this.onStop(new Blob(), this.callKey);
                        }
                        return;
                    }
                    if ("transcript" in message) {
                        // Add call key to all transcripts
                        for (let i = 0; i < message.transcript.length; i++) {
                            message.transcript[i].callKey = this.callKey;
                        }
                    }
                    (_a = this.onResult) === null || _a === void 0 ? void 0 : _a.call(this, message);
                };
                this.audioRecorder.addEventListener("dataavailable", (data) => __awaiter(this, void 0, void 0, function* () {
                    const audioBlob = data.data; // Blob is of type audio/mpeg
                    if (!this.audioSocket || this.audioSocket.readyState === 0) {
                        return;
                    }
                    const stringifiedBlob = yield this.blobToBase64(audioBlob);
                    const payload = {
                        audio: stringifiedBlob,
                        uid: "1234567890",
                    };
                    this.audioSocket.send(JSON.stringify(payload));
                }));
                yield this.audioRecorder.start();
                this.starting = false;
                return true;
            }
            catch (e) {
                console.log(e);
                // handle error here
                this.starting = false;
                return false;
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.stopping) {
                return "already_stopping";
            }
            this.stopping = true;
            if (this.starting) {
                // Wait for start to finish
                while (this.starting) {
                    yield new Promise((r) => setTimeout(r, 100));
                }
            }
            const res = yield this.closeResources();
            this.stopping = false;
            return res;
        });
    }
    closeResources() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.audioRecorder) {
                yield this.audioRecorder.stop();
                this.audioRecorder = undefined;
            }
            try {
                if (this.audioSocket) {
                    // Send end recording command
                    this.audioSocket.send(JSON.stringify({
                        stoppedRecording: "true",
                    }));
                    // Set timeout to close socket if server does not respond
                    this.closeTimeout = setTimeout(() => {
                        if (this.audioSocket) {
                            this.audioSocket.close();
                            this.audioSocket = undefined;
                        }
                    }, stopTimeoutInMs);
                }
                this.stopAllMicrophoneInstances();
                return "finishing";
            }
            catch (e) {
                // Close socket if it exists
                if (this.audioSocket) {
                    this.audioSocket.close();
                    this.audioSocket = undefined;
                }
                this.stopAllMicrophoneInstances();
                return "instant_kill";
            }
        });
    }
    stopAllMicrophoneInstances() {
        var _a;
        if (this.audioRecorder) {
            this.audioRecorder.removeEventListener("dataavailable", () => { });
            this.audioRecorder.stop();
            this.audioRecorder = undefined;
        }
        if (this.mediaStream !== null) {
            (_a = this.mediaStream) === null || _a === void 0 ? void 0 : _a.getTracks().forEach(function (track) {
                track.stop();
            });
            this.mediaStream = undefined;
        }
    }
}
exports.WebsocketManager = WebsocketManager;
