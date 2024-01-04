import { RecordAudio } from "./RecordAudio";

const stopTimeoutInMs = 20000;

export class WebsocketManager {
  // Attributes
  audioRecorder?: RecordAudio;
  mediaStream?: MediaStream;
  audioSocket?: WebSocket;
  callKey: string;
  paused = false;
  webSocketURL: string;
  language: string;
  hotwords: string[];
  onResult?: (data: any) => void;
  onStop: (entireAudioBlob: Blob, callKey: string) => void;
  closeTimeout?: NodeJS.Timeout;
  finalBlob?: Blob;
  starting = false;
  stopping = false;
  manualPunctuation: boolean;

  // Constructor
  constructor(
    onResult: (data: any) => void,
    webSocketURL: string,
    language: string,
    callKey: string,
    hotwords: string[],
    onStop: (entireAudioBlob: Blob, callKey: string) => void,
    manualPunctuation: boolean
  ) {
    this.onResult = onResult;
    this.webSocketURL = webSocketURL;
    this.language = language;
    this.callKey = callKey;
    this.hotwords = hotwords;
    this.onStop = onStop;
    this.manualPunctuation = manualPunctuation;
  }
  blobToBase64(blob: Blob) {
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

  async start() {
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
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioRecorder = new RecordAudio(this.mediaStream, (blob: Blob) => {
        this.finalBlob = blob;
      });

      this.audioSocket = new WebSocket(this.webSocketURL);
      this.audioSocket.binaryType = "blob";

      this.audioSocket.onopen = () => {
        if (this.audioSocket) {
          this.audioSocket.send(
            JSON.stringify({
              language: this.language,
              hotwords: this.hotwords.join(","),
              manual_punctuation: this.manualPunctuation,
            })
          );
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
          } else {
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
        this.onResult?.(message);
      };

      this.audioRecorder.addEventListener(
        "dataavailable",
        async (data: any) => {
          const audioBlob = data.data; // Blob is of type audio/mpeg
          if (!this.audioSocket || this.audioSocket.readyState === 0) {
            return;
          }
          const stringifiedBlob = await this.blobToBase64(audioBlob);
          const payload = {
            audio: stringifiedBlob,
            uid: "1234567890",
          };

          this.audioSocket.send(JSON.stringify(payload));
        }
      );

      await this.audioRecorder.start();
      this.starting = false;
      return true;
    } catch (e) {
      console.log(e);
      // handle error here
      this.starting = false;
      return false;
    }
  }

  async stop() {
    if (this.stopping) {
      return "already_stopping";
    }
    this.stopping = true;
    if (this.starting) {
      // Wait for start to finish
      while (this.starting) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    const res = await this.closeResources();
    this.stopping = false;
    return res;
  }

  async closeResources() {
    if (this.audioRecorder) {
      await this.audioRecorder.stop();
      this.audioRecorder = undefined;
    }
    try {
      if (this.audioSocket) {
        // Send end recording command
        this.audioSocket.send(
          JSON.stringify({
            stoppedRecording: "true",
          })
        );
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
    } catch (e) {
      // Close socket if it exists
      if (this.audioSocket) {
        this.audioSocket.close();
        this.audioSocket = undefined;
      }
      this.stopAllMicrophoneInstances();
      return "instant_kill";
    }
  }

  stopAllMicrophoneInstances() {
    if (this.audioRecorder) {
      this.audioRecorder.removeEventListener("dataavailable", () => {});
      this.audioRecorder.stop();
      this.audioRecorder = undefined;
    }
    if (this.mediaStream !== null) {
      this.mediaStream?.getTracks().forEach(function (track) {
        track.stop();
      });
      this.mediaStream = undefined;
    }
  }
}