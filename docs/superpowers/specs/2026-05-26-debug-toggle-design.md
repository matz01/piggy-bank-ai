# Design: Debug Box Toggle

**Date:** 2026-05-26
**Scope:** Hide the debug box by default; toggle via click on the commit SHA in the app header.

---

## Context

The debug box at the bottom of the app is always visible. It clutters the UI during normal use. This change hides it by default and makes it accessible via the commit SHA already present in the top-right corner of the header.

---

## Design

**File affected:** `apps/web/src/App.tsx` only.

**State:** Add `const [showDebug, setShowDebug] = useState(false)` alongside existing local state. No persistence — resets on reload, which is appropriate for a dev tool.

**Toggle:** The commit SHA span becomes a `<button>` with `onClick={() => setShowDebug((v) => !v)}`. It keeps its existing visual style (`font-mono text-[10px] text-pbai-dim`) with no additional affordance — it's a developer-only gesture.

**Conditional render:** The entire DEBUG BOX `<div>` is wrapped with `{showDebug && ...}`. The copy button inside the box is unaffected — it is a separate `<button>` and its clicks do not propagate to the SHA toggle.

---

## Out of Scope

- Persistence of open/closed state across reloads
- Any visual affordance on the SHA (underline, hover state)
- Removing the debug box entirely

---

## Testing

One test in `apps/web/src/App.test.tsx`:
- Debug box not in DOM by default
- Click on SHA → debug box appears
- Click on SHA again → debug box disappears
