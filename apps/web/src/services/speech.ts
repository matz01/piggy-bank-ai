export interface SpeechOptions {
  lang?: string;
  onResult: (transcript: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
  onDebug?: (msg: string) => void;
}

export function startTranscription(options: SpeechOptions): () => void {
  const SpeechRecognition =
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    options.onError('Speech recognition not supported in this browser.');
    return () => {};
  }

  const dbg = options.onDebug ?? (() => {});
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = options.lang ?? 'it-IT';

  recognition.onresult = (e: any) => {
    const transcript: string = e.results[0][0].transcript;
    options.onResult(transcript);
  };

  recognition.onaudiostart = () => dbg('audiostart');
  recognition.onspeechstart = () => dbg('speechstart');
  recognition.onspeechend = () => dbg('speechend');
  recognition.onaudioend = () => dbg('audioend');

  recognition.onend = options.onEnd;

  recognition.onerror = (e: any) => {
    const code = e.error ?? 'unknown';
    dbg(`onerror: ${code}`);
    options.onError(code);
  };

  recognition.start();

  return () => recognition.stop();
}
