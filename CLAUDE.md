# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

1. Think Before Coding
   Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
   Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
   Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
   Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
   Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Project Overview

**piggy-bank-ai** (`pbai`) is a mobile-first web application for personal expense tracking and budget management with AI voice input. The guiding philosophy is KISS (Keep It Simple Stupid) — maximum operational and architectural simplicity.

This is a greenfield project.

## Development Approach

- **Spec-driven**: all features start as YAML files (spec → epics → stories → tasks) before any code
- **File language**: always English (code, comments, YAML specs, this file); Italian only in conversation

## Architecture

### Stack
- **Frontend**: React + Zustand (state) + Tailwind CSS + shadcn/ui (components)
- **Agents**: Voltagent (multi-agent orchestration)
- **Speech**: Web Speech API (browser-native, on-device STT — zero cloud cost, no raw audio transmitted)
- **Backend AI**: LLM via Structured Output (semantic parsing of voice transcription)
- **Storage**: IndexedDB (local, offline-capable)

### Voice Input Flow (3 phases)
1. **Audio Acquisition**: User holds microphone button → Web Speech API transcribes on-device → text sent to backend
2. **LLM Semantic Parsing**: Backend AI extracts structured JSON `{ title, amount, tags[] }` using Structured Output
3. **Missing Data**: If `amount` is missing, AI returns a clarification question displayed on screen; user re-presses mic to provide the missing datum; frontend merges new text with prior partial state and re-sends to backend

**Session model is atomic** ("All or Nothing") — no persistent conversational history across sessions. Each session is stateless except for the in-progress partial transaction.

### UI Controls
- **Microphone (center)**: Start/stop Speech-to-Text capture
- **OK button (right)**: Commit final transaction to IndexedDB
- **Repeat button (left)**: Full reset of current session (clears partial state, returns to clean screen)
- **Tag chips (center-top)**: AI-suggested tags appear pre-selected; user can deactivate a wrong tag with a micro-tap

The UI becomes a minimal console during input — no partial text editing via voice commands.

### IndexedDB Schema (3 Object Stores)

**`spese` (Transactions)**
| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID+Timestamp) | Primary key |
| `titolo` | String | Expense name (e.g., "Negroni") |
| `importo` | Decimal | Transaction amount |
| `data` | Timestamp | Exact save time (default = device save timestamp) |
| `tag_ids` | Array\<String\> | IDs of associated tags |

**`tag` (Dictionary)**
| Field | Type | Notes |
|-------|------|-------|
| `id` | String (lowercase) | Standardized primary key (e.g., "alcolici") |
| `nome` | String | Display label (e.g., "Alcolici") |
| `frequenza_uso` | Integer | Incremented each time tag is used |

Tag normalization: frontend lowercases AI output before saving. If tag ID exists in IndexedDB → associate expense and increment counter; if not → create new record.

**`budget`**
Isolated in a third Object Store. Spending threshold logic and erosion criteria based on tag relations are TBD in future specs.
