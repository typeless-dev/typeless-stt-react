import type { Options, RecordRTCPromisesHandler } from "recordrtc";

export class RecordAudio {
  private recordRTC?: RecordRTCPromisesHandler;
  isPaused = false;
  private em: DocumentFragment;

  constructor(
    private stream: MediaStream,
    private onStop: (entireAudioBlob: Blob) => void
  ) {
    this.em = document.createDocumentFragment();
    this.onStop = onStop;
  }

  pause(): void {
    this.isPaused = true;
    // Pause the recording
    this.recordRTC?.pauseRecording();
  }

  resume(): void {
    this.isPaused = false;
    // Resume the paused recording
    this.recordRTC?.resumeRecording();
  }

  async start(timeslice = 1000, sampleRate = 16000): Promise<void> {
    try {
      const {
        default: { RecordRTCPromisesHandler, StereoAudioRecorder },
      } = await import("recordrtc");
      const recorderConfig: Options = {
        mimeType: "audio/wav",
        numberOfAudioChannels: 1, // mono
        recorderType: StereoAudioRecorder,
        timeSlice: timeslice,
        desiredSampRate: sampleRate,
        type: "audio",
        ondataavailable: async (blob: Blob) => {
          const event: any = new Event("dataavailable");

          event.data = this.isPaused
            ? new Blob([], { type: "audio/wav" })
            : blob;
          this.em.dispatchEvent(event);
        },
      };
      this.recordRTC = new RecordRTCPromisesHandler(
        this.stream,
        recorderConfig
      );

      await this.recordRTC.startRecording();
    } catch (e) {
      const event: any = new Event("error");
      event.data = "error message";
      this.em.dispatchEvent(event);
      console.error(e);
    }
  }

  async stop(): Promise<void> {
    await this.recordRTC?.stopRecording();
    const blob = await this.recordRTC?.getBlob();
    this.onStop(blob || new Blob([]));

    // On stop, stop all audio tracks
    this.stream?.getAudioTracks().forEach((track) => track.stop());
  }

  addEventListener(event: string, callback: any): void {
    this.em.addEventListener(event, callback);
  }

  removeEventListener(event: string, callback: any): void {
    this.em.removeEventListener(event, callback);
  }

  dispatchEvent(event: Event): void {
    this.em.dispatchEvent(event);
  }
}
