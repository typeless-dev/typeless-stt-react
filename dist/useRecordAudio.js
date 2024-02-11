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
exports.useRecordAudio = void 0;
const react_1 = require("react");
const WebsocketManager_1 = require("./WebsocketManager");
const useRecordAudio = ({ onNewResult, websocketUrl, language, hotwords, hotwordsWeight, onStop, manualPunctuation, voiceCommands, domain, endUserId, }) => {
    const webSocketManager = (0, react_1.useRef)(null);
    const currentlyStarting = (0, react_1.useRef)(false);
    const currentlyStopping = (0, react_1.useRef)(false);
    const currentlyRecording = (0, react_1.useRef)(false);
    const stopRecording = () => __awaiter(void 0, void 0, void 0, function* () {
        if (currentlyStopping.current || currentlyStarting.current) {
            return "already_stopping";
        }
        currentlyStopping.current = true;
        const res = webSocketManager.current
            ? yield webSocketManager.current.stop()
            : "not_started";
        webSocketManager.current = null;
        currentlyStopping.current = false;
        currentlyRecording.current = false;
        return res;
    });
    (0, react_1.useEffect)(() => {
        return () => {
            stopRecording();
        };
    }, []);
    const startRecording = (callKey) => __awaiter(void 0, void 0, void 0, function* () {
        if (currentlyStopping.current) {
            return {
                microphoneLabel: "",
                error: "stopping",
            };
        }
        if (currentlyStarting.current) {
            return {
                microphoneLabel: "",
                error: "already_starting",
            };
        }
        if (currentlyRecording.current) {
            return {
                microphoneLabel: "",
                error: "already_recording",
            };
        }
        currentlyStarting.current = true;
        const websocketInstance = new WebsocketManager_1.WebsocketManager(onNewResult, websocketUrl, language, callKey, hotwords, onStop, manualPunctuation, hotwordsWeight, voiceCommands, domain, endUserId);
        const microphoneLabel = yield websocketInstance.start();
        webSocketManager.current = websocketInstance;
        currentlyStarting.current = false;
        currentlyRecording.current = true;
        return {
            microphoneLabel: microphoneLabel,
            error: "",
        };
    });
    return {
        startRecording,
        stopRecording,
    };
};
exports.useRecordAudio = useRecordAudio;
