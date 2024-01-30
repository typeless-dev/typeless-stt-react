type useRecordAudioProps = {
    onNewResult: (data: any) => void;
    websocketUrl: string;
    language: string;
    hotwords: string[];
    hotwordsWeight?: number;
    onStop: (entireAudioBlob: Blob, callKey: string) => void;
    manualPunctuation: boolean;
    voiceCommands?: {
        [key: string]: string;
    };
    domain?: string;
};
export declare const useRecordAudio: ({ onNewResult, websocketUrl, language, hotwords, hotwordsWeight, onStop, manualPunctuation, voiceCommands, domain, }: useRecordAudioProps) => {
    startRecording: (callKey: string) => Promise<{
        microphoneLabel: string;
        error: string;
    }>;
    stopRecording: () => Promise<"already_stopping" | "finishing" | "instant_kill" | "not_started">;
};
export {};
