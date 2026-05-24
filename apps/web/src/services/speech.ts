export interface Recorder {
  start: () => void;
  stop: () => Promise<Blob>;
}

export async function createRecorder(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return {
    start() {
      chunks.length = 0;
      recorder.start();
    },
    stop() {
      return new Promise<Blob>((resolve, reject) => {
        recorder.onerror = (e: Event) => {
          stream.getTracks().forEach((t) => t.stop());
          reject((e as any).error ?? new Error('MediaRecorder error'));
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      });
    },
  };
}
