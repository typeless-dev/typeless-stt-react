import { useEffect, useRef } from "react";
import { WebsocketManager } from "./WebsocketManager";

type useRecordAudioProps = {
  onNewResult: (data: any) => void;
  websocketUrl: string;
  language: string;
  hotwords: string[];
  hotwordsWeight?: number;
  onStop: (entireAudioBlob: Blob, callKey: string) => void;
  manualPunctuation: boolean;
  voiceCommands?: { [key: string]: string };
  domain?: string;
  endUserId?: string;
};

export const useRecordAudio = ({
  onNewResult,
  websocketUrl,
  language,
  hotwords,
  hotwordsWeight,
  onStop,
  manualPunctuation,
  voiceCommands,
  domain,
  endUserId,
}: useRecordAudioProps) => {
  const webSocketManager = useRef<WebsocketManager | null>(null);
  const currentlyStarting = useRef<boolean>(false);
  const currentlyStopping = useRef<boolean>(false);
  const currentlyRecording = useRef<boolean>(false);

  const stopRecording = async () => {
    if (currentlyStopping.current || currentlyStarting.current) {
      return "already_stopping";
    }
    currentlyStopping.current = true;
    const res = webSocketManager.current
      ? await webSocketManager.current.stop()
      : "not_started";
    webSocketManager.current = null;
    currentlyStopping.current = false;
    currentlyRecording.current = false;
    return res;
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async (callKey: string) => {
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
    const websocketInstance = new WebsocketManager(
      onNewResult,
      websocketUrl,
      language,
      callKey,
      hotwords,
      onStop,
      manualPunctuation,
      hotwordsWeight,
      voiceCommands,
      domain,
      endUserId
    );
    const microphoneLabel = await websocketInstance.start();
    webSocketManager.current = websocketInstance;
    currentlyStarting.current = false;
    currentlyRecording.current = true;
    return {
      microphoneLabel: microphoneLabel,
      error: "",
    };
  };

  return {
    startRecording,
    stopRecording,
  };
};
