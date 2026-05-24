# Server-Side STT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Web Speech API with MediaRecorder + Groq Whisper server-side transcription so the app works reliably on iOS Safari.

**Architecture:** Frontend records audio via MediaRecorder (hold-to-talk), uploads the Blob to a new `/transcribe` endpoint that calls Groq Whisper and returns `{ text }`, then the existing `/parse` flow continues unchanged. MicButton is updated to use pointer events for true hold-to-talk on mobile.

**Tech Stack:** `groq-sdk`, MediaRecorder API, Hono multipart form parsing, Vitest + jsdom (frontend), Vitest + Node (backend)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/api/src/routes/transcribe.ts` | Receives audio, calls Groq Whisper, returns `{ text }` |
| Create | `apps/api/src/routes/transcribe.test.ts` | Unit tests for `/transcribe` route |
| Modify | `apps/api/src/app.ts` | Register `/transcribe` route |
| Rewrite | `apps/web/src/services/speech.ts` | `createRecorder()` using MediaRecorder |
| Create | `apps/web/src/services/speech.test.ts` | Unit tests for `createRecorder` |
| Modify | `apps/web/src/services/api.ts` | Add `transcribe(audio: Blob): Promise<string>` |
| Modify | `apps/web/src/services/api.test.ts` | Add `transcribe` tests |
| Modify | `apps/web/src/App.tsx` | Use `createRecorder` + `transcribe`, async handlers |
| Modify | `apps/web/src/App.test.tsx` | Update mocks and tests for new flow |
| Modify | `apps/web/src/components/MicButton.tsx` | Pointer events for hold-to-talk |

---

## Task 1: Install groq-sdk

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install the package**

```bash
npm install groq-sdk --workspace=apps/api
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Create apps/api/.env with placeholder key**

Create `apps/api/.env` (if it doesn't exist — check first with `ls apps/api/.env`):

```
GROQ_API_KEY=your-groq-api-key-here
```

Get your free key at https://console.groq.com. Do not commit this file (`.env` is already in `.gitignore`).

- [ ] **Step 3: Commit package changes**

```bash
git add apps/api/package.json apps/api/package-lock.json
git commit -m "chore: add groq-sdk to api dependencies"
```

---

## Task 2: Backend /transcribe route (TDD)

**Files:**
- Create: `apps/api/src/routes/transcribe.test.ts`
- Create: `apps/api/src/routes/transcribe.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/routes/transcribe.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('groq-sdk', () => ({
  default: vi.fn(() => ({
    audio: { transcriptions: { create: mockCreate } },
  })),
}));

import app from '../app.js';

describe('POST /transcribe', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns 400 when file is missing', async () => {
    const form = new FormData();
    const res = await app.request('/transcribe', { method: 'POST', body: form });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'file is required' });
  });

  it('returns transcribed text when file is provided', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'caffè uno cinquanta' });
    const form = new FormData();
    form.append('file', new Blob(['audio'], { type: 'audio/webm' }), 'audio.webm');
    const res = await app.request('/transcribe', { method: 'POST', body: form });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'caffè uno cinquanta' });
  });

  it('returns 500 when Groq throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('rate limit exceeded'));
    const form = new FormData();
    form.append('file', new Blob(['audio'], { type: 'audio/webm' }), 'audio.webm');
    const res = await app.request('/transcribe', { method: 'POST', body: form });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'rate limit exceeded' });
  });

  it('calls Groq with whisper-large-v3 and language it', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'test' });
    const form = new FormData();
    form.append('file', new Blob(['audio'], { type: 'audio/webm' }), 'audio.webm');
    await app.request('/transcribe', { method: 'POST', body: form });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-large-v3', language: 'it' })
    );
  });
});
```

- [ ] **Step 2: Create minimal stub so the test compiles**

Create `apps/api/src/routes/transcribe.ts`:

```ts
import { Hono } from 'hono';

const app = new Hono();
app.post('/', async (c) => c.json({ error: 'not implemented' }, 500));
export default app;
```

- [ ] **Step 3: Register the route in app.ts**

Edit `apps/api/src/app.ts`:

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import parse from './routes/parse.js';
import transcribe from './routes/transcribe.js';

const app = new Hono();
app.use('/*', cors());
app.route('/parse', parse);
app.route('/transcribe', transcribe);

export default app;
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npm test --workspace=apps/api
```

Expected: tests compile but assertions fail (stub returns 500 for all requests).

- [ ] **Step 5: Implement the route**

Overwrite `apps/api/src/routes/transcribe.ts`:

```ts
import { Hono } from 'hono';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.formData();
  const file = body.get('file');
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'file is required' }, 400);
  }
  try {
    const result = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      language: 'it',
    });
    return c.json({ text: result.text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'transcription failed';
    return c.json({ error: msg }, 500);
  }
});

export default app;
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test --workspace=apps/api
```

Expected: all tests pass including the 4 new `/transcribe` tests.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/routes/transcribe.ts apps/api/src/routes/transcribe.test.ts apps/api/src/app.ts
git commit -m "feat: add /transcribe endpoint with Groq Whisper"
```

---

## Task 3: Frontend speech.ts rewrite (TDD)

**Files:**
- Create: `apps/web/src/services/speech.test.ts`
- Rewrite: `apps/web/src/services/speech.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/services/speech.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test --workspace=apps/web -- --reporter=verbose 2>&1 | grep -A5 'speech'
```

Expected: test file errors because `createRecorder` does not exist yet.

- [ ] **Step 3: Rewrite speech.ts**

Replace the entire content of `apps/web/src/services/speech.ts`:

```ts
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
      return new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.stop();
      });
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test --workspace=apps/web
```

Expected: all 5 `createRecorder` tests pass. Existing tests should still pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/services/speech.ts apps/web/src/services/speech.test.ts
git commit -m "feat: rewrite speech.ts with MediaRecorder createRecorder()"
```

---

## Task 4: Frontend api.ts — add transcribe() (TDD)

**Files:**
- Modify: `apps/web/src/services/api.test.ts`
- Modify: `apps/web/src/services/api.ts`

- [ ] **Step 1: Add failing tests to api.test.ts**

Append these tests after the existing `describe('parse', ...)` block in `apps/web/src/services/api.test.ts`:

```ts
import { transcribe } from './api.js';

describe('transcribe', () => {
  it('sends audio blob as form-data to /transcribe', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'caffè uno cinquanta' }),
    } as Response);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await transcribe(blob);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/transcribe'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toBe('caffè uno cinquanta');
  });

  it('sends file as FormData instance', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'test' }),
    } as Response);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await transcribe(blob);

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect((options as RequestInit).body).toBeInstanceOf(FormData);
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await expect(transcribe(blob)).rejects.toThrow('transcribe failed: 500');
  });
});
```

Note: the existing `beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); })` at the top of `api.test.ts` already covers these tests — no additional setup needed.

Also add `transcribe` to the import at the top of `api.test.ts`:

```ts
import { parse, transcribe } from './api.js';
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test --workspace=apps/web
```

Expected: 3 new tests fail because `transcribe` is not exported from `api.ts`.

- [ ] **Step 3: Add transcribe() to api.ts**

Edit `apps/web/src/services/api.ts` — add after the existing `parse` function:

```ts
export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', audio, 'audio');
  const res = await fetch(`${API_URL}/transcribe`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`transcribe failed: ${res.status}`);
  const data = await res.json();
  return data.text;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test --workspace=apps/web
```

Expected: all tests pass including the 3 new `transcribe` tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/services/api.ts apps/web/src/services/api.test.ts
git commit -m "feat: add transcribe() to api service"
```

---

## Task 5: Frontend App.tsx + MicButton (TDD)

**Files:**
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/MicButton.tsx`

- [ ] **Step 1: Rewrite App.test.tsx**

Replace the entire content of `apps/web/src/App.test.tsx`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.js';
import { useSession } from './store/sessionStore.js';

vi.mock('./services/speech.js', () => ({
  createRecorder: vi.fn(),
}));
vi.mock('./services/api.js', () => ({
  parse: vi.fn(),
  transcribe: vi.fn(),
}));
vi.mock('./services/db.js', () => ({
  saveTransaction: vi.fn(),
  resolveAndSaveTags: vi.fn(),
  readAllTagIds: vi.fn().mockResolvedValue([]),
}));

import { createRecorder } from './services/speech.js';
import { parse, transcribe } from './services/api.js';

describe('App mic flow', () => {
  const mockBlob = new Blob(['audio']);
  const mockStart = vi.fn();
  const mockStop = vi.fn().mockResolvedValue(mockBlob);

  beforeEach(() => {
    useSession.setState({ state: 'idle', partial: null, clarification: null, queryResult: null });
    vi.mocked(createRecorder).mockResolvedValue({ start: mockStart, stop: mockStop });
    vi.mocked(transcribe).mockResolvedValue('caffè uno cinquanta');
    vi.mocked(parse).mockResolvedValue({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });
  });

  it('enters recording state after mic press', async () => {
    render(<App />);
    await userEvent.pointer({ target: screen.getByRole('button', { name: 'Microfono' }), keys: '[MouseLeft>]' });
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    expect(createRecorder).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalled();
  });

  it('transitions to preview on release after successful transcription', async () => {
    render(<App />);
    await userEvent.pointer({ target: screen.getByRole('button', { name: 'Microfono' }), keys: '[MouseLeft>]' });
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    await userEvent.pointer({ keys: '[/MouseLeft]' });
    await waitFor(() => expect(useSession.getState().state).toBe('preview'));
    expect(transcribe).toHaveBeenCalledWith(mockBlob);
    expect(parse).toHaveBeenCalledWith(expect.objectContaining({ text: 'caffè uno cinquanta' }));
  });

  it('stays idle when createRecorder fails (microphone permission denied)', async () => {
    vi.mocked(createRecorder).mockRejectedValueOnce(new Error('Permission denied'));
    render(<App />);
    await userEvent.pointer({ target: screen.getByRole('button', { name: 'Microfono' }), keys: '[MouseLeft>]' });
    await waitFor(() => expect(useSession.getState().state).toBe('idle'));
  });

  it('returns to idle when transcribe fails', async () => {
    vi.mocked(transcribe).mockRejectedValueOnce(new Error('Network error'));
    render(<App />);
    await userEvent.pointer({ target: screen.getByRole('button', { name: 'Microfono' }), keys: '[MouseLeft>]' });
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    await userEvent.pointer({ keys: '[/MouseLeft]' });
    await waitFor(() => expect(useSession.getState().state).toBe('idle'));
  });

  it('returns to idle when parse fails', async () => {
    vi.mocked(parse).mockRejectedValueOnce(new Error('Parse error'));
    render(<App />);
    await userEvent.pointer({ target: screen.getByRole('button', { name: 'Microfono' }), keys: '[MouseLeft>]' });
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    await userEvent.pointer({ keys: '[/MouseLeft]' });
    await waitFor(() => expect(useSession.getState().state).toBe('idle'));
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test --workspace=apps/web
```

Expected: new tests fail — `createRecorder` is not exported by `speech.js` mock, and `App.tsx` still uses `startTranscription`.

- [ ] **Step 3: Update App.tsx**

In `apps/web/src/App.tsx`, make these changes:

**Replace the import block at the top** (change `startTranscription` → `createRecorder`, add `Recorder` type, add `transcribe`):

```ts
import { useState, useCallback, useRef } from 'react';
import { useSession } from './store/sessionStore.js';
import { createRecorder, type Recorder } from './services/speech.js';
import { parse, transcribe } from './services/api.js';
import { saveTransaction, resolveAndSaveTags, readAllTagIds } from './services/db.js';
import { isClarification, isQueryResult } from '@pbai/shared';
import { MicButton } from './components/MicButton.js';
import { ModeSwitch } from './components/ModeSwitch.js';
import { TagChips } from './components/TagChips.js';
import { TransactionPreview } from './components/TransactionPreview.js';
import { ClarificationPrompt } from './components/ClarificationPrompt.js';
import { QueryResultView } from './components/QueryResultView.js';
import { QueryDetailView } from './components/QueryDetailView.js';
```

**Replace the ref** (inside `App()`, replace the `stopRecognitionRef` line):

```ts
const recorderRef = useRef<Recorder | null>(null);
```

**Replace `handleMicPress`**:

```ts
const handleMicPress = useCallback(async () => {
  if (session.state === 'processing' || session.state === 'recording') return;
  if (recorderRef.current) return;
  dbg('mic press');
  try {
    const recorder = await createRecorder();
    recorder.start();
    recorderRef.current = recorder;
    session.setState('recording');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    dbg(`mic ERR: ${msg.slice(0, 60)}`);
    session.setState('idle');
  }
}, [session]);
```

**Replace `handleMicRelease`**:

```ts
const handleMicRelease = useCallback(async () => {
  if (!recorderRef.current) return;
  const recorder = recorderRef.current;
  recorderRef.current = null;
  session.setState('processing');
  try {
    const blob = await recorder.stop();
    const transcript = await transcribe(blob);
    dbg(`transcript: "${transcript.slice(0, 40)}"`);
    const tags = await readAllTagIds();
    const response = await parse({
      text: transcript,
      partial: useSession.getState().partial ?? undefined,
      mode,
      tags,
      today: Date.now(),
    });
    dbg(`response: ${JSON.stringify(response).slice(0, 60)}`);
    if (isQueryResult(response)) {
      session.setQueryResult(response);
      session.setState('query_result');
    } else if (isClarification(response)) {
      session.setPartial(response.partial);
      session.setClarification(response.clarification);
      session.setState('clarification');
    } else {
      session.setPartial(response);
      setSelectedTags(response.tag);
      session.setState('preview');
    }
  } catch (err) {
    console.error('Error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    dbg(`ERR: ${msg.slice(0, 80)}`);
    session.setState('idle');
  }
}, [session, mode]);
```

**Replace `handleCancel`** (remove `stopRecognitionRef.current?.()` since it no longer applies):

```ts
const handleCancel = useCallback(() => {
  recorderRef.current = null;
  session.reset();
  setSelectedTags([]);
  setMode('expense');
}, [session]);
```

- [ ] **Step 4: Update MicButton.tsx for hold-to-talk**

The MicButton tests already test pointer events (`[MouseLeft>]` / `[/MouseLeft]`). Update the implementation to match.

Replace the `button` constant in `apps/web/src/components/MicButton.tsx`. Change the event handling from `onClick` to `onPointerDown`/`onPointerUp`/`onPointerLeave`:

```tsx
const button = (
  <button
    role="button"
    aria-label="Microfono"
    aria-busy={isProcessing}
    disabled={isProcessing}
    onPointerDown={(e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onPress();
    }}
    onPointerUp={() => {
      if (isRecording) onRelease();
    }}
    onPointerLeave={() => {
      if (isRecording) onRelease();
    }}
    style={{ opacity: isProcessing ? 0.5 : 1 }}
    className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all select-none touch-none ${
      isRecording
        ? 'bg-pbai-expense border-pbai-accent/50 animate-red-breathe'
        : 'bg-pbai-surface border-pbai-border'
    }`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-pbai-dim'}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 10a6 6 0 0 1-12 0H4a8 8 0 0 0 16 0h-2zm-6 8v2H9v2h6v-2h-3v-2z" />
    </svg>
  </button>
);
```

`setPointerCapture` ensures the button keeps receiving pointer events even when the user's finger slides slightly off the button area — essential for hold-to-talk on mobile.

- [ ] **Step 5: Run all tests**

```bash
npm test --workspace=apps/web
```

Expected: all tests pass — 5 new App flow tests + all MicButton tests.

- [ ] **Step 6: Run backend tests to confirm no regression**

```bash
npm test --workspace=apps/api
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx apps/web/src/components/MicButton.tsx
git commit -m "feat: wire App.tsx to createRecorder + transcribe, hold-to-talk MicButton"
```
