import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRecorder } from './speech.js';

describe('createRecorder', () => {
  const mockTrackStop = vi.fn();
  const mockStream = { getTracks: () => [{ stop: mockTrackStop }] };

  let capturedOnDataAvailable: ((e: { data: Blob }) => void) | undefined;
  let capturedOnStop: (() => void) | undefined;

  const mockRecorderInstance = {
    start: vi.fn(),
    stop: vi.fn(),
    mimeType: 'audio/webm',
    set ondataavailable(fn: (e: { data: Blob }) => void) { capturedOnDataAvailable = fn; },
    set onstop(fn: () => void) { capturedOnStop = fn; },
  };

  beforeEach(() => {
    capturedOnDataAvailable = undefined;
    capturedOnStop = undefined;
    vi.clearAllMocks();
    vi.stubGlobal('MediaRecorder', vi.fn(() => mockRecorderInstance));
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls getUserMedia with audio: true', async () => {
    await createRecorder();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('start() calls MediaRecorder.start()', async () => {
    const recorder = await createRecorder();
    recorder.start();
    expect(mockRecorderInstance.start).toHaveBeenCalled();
  });

  it('stop() resolves with a Blob assembled from chunks', async () => {
    const recorder = await createRecorder();
    recorder.start();
    capturedOnDataAvailable!({ data: new Blob(['chunk1']) });
    capturedOnDataAvailable!({ data: new Blob(['chunk2']) });
    const stopPromise = recorder.stop();
    capturedOnStop!();
    const blob = await stopPromise;
    expect(blob).toBeInstanceOf(Blob);
  });

  it('stop() releases microphone tracks', async () => {
    const recorder = await createRecorder();
    recorder.start();
    const stopPromise = recorder.stop();
    capturedOnStop!();
    await stopPromise;
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it('rejects when getUserMedia is denied', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')) },
      writable: true,
      configurable: true,
    });
    await expect(createRecorder()).rejects.toThrow('Permission denied');
  });
});
