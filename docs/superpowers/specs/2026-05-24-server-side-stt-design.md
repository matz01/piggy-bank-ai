# Server-Side STT — Design

**Date:** 2026-05-24  
**Status:** Approved  
**Scope:** Sostituisce Web Speech API con registrazione audio lato client + trascrizione Groq Whisper lato server.

## Motivazione

Web Speech API presenta bug irrisolvibili su iOS Safari (evento `aborted`, comportamento inconsistente su `recognition.stop()`). Poiché l'app deve girare su mobile, si migra a MediaRecorder + Groq Whisper server-side.

---

## Flusso

```
press   → MediaRecorder.start()
release → MediaRecorder.stop() → Blob audio
        → POST /transcribe → { text }
        → POST /parse     → ParseResponse (invariato)
```

Lo stato `processing` copre entrambe le chiamate di rete. Nessun nuovo stato UI.

---

## Frontend

### `apps/web/src/services/speech.ts` (riscritto)

Esporta un'interfaccia `Recorder` e una factory `createRecorder()`:

```ts
export interface Recorder {
  start: () => void;
  stop: () => Promise<Blob>;
}

export async function createRecorder(): Promise<Recorder>
```

Implementazione interna:
1. `navigator.mediaDevices.getUserMedia({ audio: true })` — richiede permesso microfono
2. `new MediaRecorder(stream)` — rileva automaticamente il formato supportato (preferisce `audio/webm` su Chrome/Android, `audio/mp4` su iOS Safari — entrambi accettati da Whisper)
3. `start()` avvia la registrazione
4. `stop()` ferma la registrazione, assembla i chunk, rilascia il microfono (`stream.getTracks().forEach(t => t.stop())`), risolve la Promise con il `Blob`

### `apps/web/src/services/api.ts` (aggiunta funzione)

```ts
export async function transcribe(audio: Blob): Promise<string>
```

Invia `multipart/form-data` con `file: Blob` a `POST /transcribe`. Restituisce il testo trascritto. Propaga errori HTTP come eccezioni.

### `apps/web/src/App.tsx` (modifiche chirurgiche)

- `stopRecognitionRef` → `recorderRef` di tipo `React.MutableRefObject<Recorder | null>`
- `handleMicPress`: chiama `createRecorder()` — se fallisce (es. permesso microfono negato) → `onError` → `session.setState('idle')`; altrimenti `session.setState('recording')` e salva il recorder in `recorderRef`
- `handleMicRelease`: `recorderRef.current.stop()` → `transcribe(blob)` → `parse({ text, ... })` → gestione response (invariata)
- `handleCancel`: `recorderRef.current` rimane null-safe (nessuna registrazione da fermare se non attiva)

---

## Backend

### Nuova route `apps/api/src/routes/transcribe.ts`

```
POST /transcribe
Content-Type: multipart/form-data
Body: { file: <audio Blob> }

200: { text: string }
400: { error: "file is required" }
500: { error: string }
```

- Legge il file dal form con `c.req.formData()`
- Chiama Groq Whisper (`whisper-large-v3`, `language: "it"`)
- Restituisce `{ text }`

### `apps/api/src/app.ts` (aggiunta route)

```ts
app.route('/transcribe', transcribe);
```

### Provider Groq per audio

Il client Groq SDK (`groq-sdk`) viene usato direttamente nella route `/transcribe` (non tramite AI SDK, che non supporta la Transcription API di Groq). La route importa e istanzia `new Groq({ apiKey: process.env.GROQ_API_KEY })`.

---

## Configurazione

| Variabile | Ambiente | Come impostare |
|-----------|----------|----------------|
| `GROQ_API_KEY` | `apps/api` | Locale: `.env` nella root di `apps/api`; Produzione: variabile d'ambiente Vercel |

---

## Cosa NON cambia

- `MicButton.tsx` — invariato
- Route `/parse` e tutti gli agenti — invariati
- `sessionStore.ts` — invariato
- `db.ts` — invariato
- `@pbai/shared` — invariato

---

## Test

- `speech.ts`: mock di `getUserMedia` e `MediaRecorder`; verifica che `stop()` assembli i chunk e rilasci il microfono
- `transcribe` route: mock del client Groq; verifica 400 senza file, 200 con file, propagazione errori Groq
- `api.ts#transcribe`: mock di `fetch`; verifica che il form-data venga costruito correttamente
- `App.tsx`: i test esistenti di `handleMicPress`/`handleMicRelease` vanno aggiornati per mockare `createRecorder` e `transcribe` invece di `startTranscription`
