# piggy-bank-ai MVP Design

**Date:** 2026-05-20
**Scope:** Inserimento spese + Dizionario tag

---

## 1. Overview

Mobile-first web app for personal expense tracking via AI voice input. The user speaks an expense, the app transcribes it on-device (Web Speech API), sends the text to a backend agent that parses it into structured JSON, and saves the result to local IndexedDB storage.

MVP excludes: budget logic, user settings/configuration screen, multi-user auth.

---

## 2. Repository Structure

Monorepo managed with pnpm workspaces.

```
pbai/
├── apps/
│   ├── web/        ← React PWA (Vite + React + Zustand + Tailwind + shadcn/ui)
│   └── api/        ← Node.js server (Hono + Voltagent)
├── packages/
│   └── shared/     ← shared TypeScript types (Transaction, Tag, ParseResult, ClarificationResult)
├── pnpm-workspace.yaml
└── package.json
```

Frontend deployed on Vercel. Backend deployed on Railway. Communication via HTTP REST.

---

## 3. Frontend Architecture (apps/web)

Single-screen PWA, no routing.

### File structure

```
src/
├── components/
│   ├── MicButton.tsx           ← hold-to-record; states: idle | recording | processing
│   ├── TagChips.tsx            ← AI-suggested tags, pre-selected; tap to deselect
│   ├── TransactionPreview.tsx  ← shows titolo + importo before commit
│   └── ClarificationPrompt.tsx ← displays AI clarification question when importo is missing
├── store/
│   └── sessionStore.ts         ← Zustand: current session partial state
├── services/
│   ├── speech.ts               ← Web Speech API wrapper
│   ├── api.ts                  ← HTTP calls to POST /parse
│   └── db.ts                   ← IndexedDB operations (spese, tag)
└── App.tsx                     ← main layout
```

### UI Controls

Three controls fixed at the bottom of the screen:

| Position | Control | Visible when | Action |
|----------|---------|--------------|--------|
| Left | **X** | Partial transaction exists | Cancel session, full reset to idle |
| Center | **Mic** | Always | Start/stop voice transcription |
| Right | **OK** | Partial transaction exists | Commit to IndexedDB, reset to idle |

X and OK are hidden in the initial idle state (before the first mic press).

### Session flow

1. User holds Mic → `speech.ts` transcribes on-device via Web Speech API
2. Transcript sent to `api.ts` → `POST /parse` → response
3a. If `ParseResult`: show TransactionPreview + TagChips → user taps OK to save or X to cancel
3b. If `ClarificationResult`: show ClarificationPrompt → user presses Mic again → transcript merged with `partial` state → re-sent to `POST /parse`
4. OK → `db.ts` saves to IndexedDB → reset to idle

Session is atomic: either fully committed on OK or fully discarded on X. No persistent state across sessions.

---

## 4. Backend Architecture (apps/api)

```
src/
├── agents/
│   └── parserAgent.ts  ← Voltagent agent: text → ParseResult | ClarificationResult
├── routes/
│   └── parse.ts        ← POST /parse handler
├── providers/
│   └── llm.ts          ← Vercel AI SDK adapter (provider/model hardcoded for MVP)
└── index.ts            ← Hono server entry point
```

### API

```
POST /parse
Content-Type: application/json

Body:
{
  text: string,
  partial?: {
    titolo?: string,
    importo?: number,
    tag_ids?: string[]
  }
}

Response (success):
{
  titolo: string,
  importo: number,
  tag: string[]
}

Response (missing data):
{
  clarification: string
}
```

The `partial` field is optional and sent only when the user is answering a clarification question (i.e. a previous call returned `{ clarification }`). It carries the partial transaction state accumulated so far. The agent merges `text` + `partial` before parsing. On the first call, `partial` is omitted.

Each request is stateless. The server holds no session state.

### LLM configuration (MVP)

Provider, model, and API key are hardcoded constants in `providers/llm.ts`. A predefined list of supported providers (Anthropic, OpenAI, Google) will be exposed through user settings in a post-MVP release. The Vercel AI SDK provides the provider-agnostic interface.

### Agent

`parserAgent` uses Structured Output with a fixed schema. It does not maintain conversational history. Its sole responsibility: extract `{ titolo, importo, tag[] }` from natural language, or return a clarification question if `importo` is missing.

---

## 5. Data Layer (IndexedDB)

Three object stores. All managed via `apps/web/src/services/db.ts`.

### `spese` (transactions)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | UUID + timestamp, primary key |
| `titolo` | string | Expense name |
| `importo` | number | Amount |
| `data` | number | Unix timestamp, device save time |
| `tag_ids` | string[] | Associated tag IDs |

### `tag` (dictionary)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Lowercase, primary key (e.g. `"alcolici"`) |
| `nome` | string | Display label (e.g. `"Alcolici"`) |
| `frequenza_uso` | number | Incremented on each use |

**Tag normalization on save:**
1. For each tag string from the API response → lowercase → look up in `tag` store
2. Found → associate with expense, increment `frequenza_uso`
3. Not found → create new `tag` record, then associate

### `budget`

Object store created but empty. No logic implemented in MVP.

---

## 6. Out of Scope (MVP)

- User settings screen (provider, model, API key)
- Budget logic and erosion criteria
- Advisor agent (spending pattern analysis)
- Authentication / multi-user
- Expense history / list view
- Edit or delete existing expenses
