"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.RecordAudio = void 0;
class RecordAudio {
    constructor(stream, onStop) {
        this.stream = stream;
        this.onStop = onStop;
        this.isPaused = false;
        this.em = document.createDocumentFragment();
        this.onStop = onStop;
    }
    pause() {
        var _a;
        this.isPaused = true;
        // Pause the recording
        (_a = this.recordRTC) === null || _a === void 0 ? void 0 : _a.pauseRecording();
    }
    resume() {
        var _a;
        this.isPaused = false;
        // Resume the paused recording
        (_a = this.recordRTC) === null || _a === void 0 ? void 0 : _a.resumeRecording();
    }
    start(timeslice = 1000, sampleRate = 16000) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { default: { RecordRTCPromisesHandler, StereoAudioRecorder }, } = yield Promise.resolve().then(() => __importStar(require("recordrtc")));
                const recorderConfig = {
                    mimeType: "audio/wav",
                    numberOfAudioChannels: 1, // mono
                    recorderType: StereoAudioRecorder,
                    timeSlice: timeslice,
                    desiredSampRate: sampleRate,
                    type: "audio",
                    ondataavailable: (blob) => __awaiter(this, void 0, void 0, function* () {
                        const event = new Event("dataavailable");
                        event.data = this.isPaused
                            ? new Blob([], { type: "audio/wav" })
                            : blob;
                        this.em.dispatchEvent(event);
                    }),
                };
                this.recordRTC = new RecordRTCPromisesHandler(this.stream, recorderConfig);
                yield this.recordRTC.startRecording();
            }
            catch (e) {
                const event = new Event("error");
                event.data = "error message";
                this.em.dispatchEvent(event);
                console.error(e);
            }
        });
    }
    stop() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            yield ((_a = this.recordRTC) === null || _a === void 0 ? void 0 : _a.stopRecording());
            const blob = yield ((_b = this.recordRTC) === null || _b === void 0 ? void 0 : _b.getBlob());
            this.onStop(blob || new Blob([]));
            // On stop, stop all audio tracks
            (_c = this.stream) === null || _c === void 0 ? void 0 : _c.getAudioTracks().forEach((track) => track.stop());
        });
    }
    addEventListener(event, callback) {
        this.em.addEventListener(event, callback);
    }
    removeEventListener(event, callback) {
        this.em.removeEventListener(event, callback);
    }
    dispatchEvent(event) {
        this.em.dispatchEvent(event);
    }
}
exports.RecordAudio = RecordAudio;
