type useRecordAudioProps = {
    onNewResult: (data: any) => void;
    websocketUrl: string;
    language: string;
    hotwords: string[];
    onStop: (entireAudioBlob: Blob, callKey: string) => void;
    manualPunctuation: boolean;
};
export declare const useRecordAudio: ({ onNewResult, websocketUrl, language, hotwords, onStop, manualPunctuation, }: useRecordAudioProps) => {
    startRecording: (callKey: string) => Promise<boolean>;
    stopRecording: () => Promise<"already_stopping" | "finishing" | "instant_kill" | "not_started">;
};
export {};
