export declare class RecordAudio {
    private stream;
    private onStop;
    private recordRTC?;
    isPaused: boolean;
    private em;
    constructor(stream: MediaStream, onStop: (entireAudioBlob: Blob) => void);
    pause(): void;
    resume(): void;
    start(timeslice?: number, sampleRate?: number): Promise<void>;
    stop(): Promise<void>;
    addEventListener(event: string, callback: any): void;
    removeEventListener(event: string, callback: any): void;
    dispatchEvent(event: Event): void;
}
