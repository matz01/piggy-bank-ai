# Debug Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the debug box by default and toggle it via click on the commit SHA in the app header.

**Architecture:** Single local `showDebug` boolean in `App.tsx`; commit SHA span becomes a button; debug box wrapped in a conditional render. No new files, no new components.

**Tech Stack:** React 19, Vitest + @testing-library/react

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/App.tsx` | Modify | Add `showDebug` state, SHA toggle button, conditional debug box |
| `apps/web/src/App.test.tsx` | Modify | 3 new tests for debug toggle behaviour |

---

## Task 1: Debug box toggle

**Files:**
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/App.tsx`

### Step 1: Write the failing tests

Append a new `describe` block at the end of `apps/web/src/App.test.tsx`:

```tsx
describe('Debug toggle', () => {
  beforeEach(() => {
    useSession.setState({ state: 'idle', partial: null, clarification: null, queryResult: null });
  });

  it('does not show the debug box by default', () => {
    render(<App />);
    expect(screen.queryByText('DEBUG')).not.toBeInTheDocument();
  });

  it('shows the debug box after clicking the commit SHA', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('dev'));
    expect(screen.getByText('DEBUG')).toBeInTheDocument();
  });

  it('hides the debug box after clicking the commit SHA twice', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('dev'));
    await userEvent.click(screen.getByText('dev'));
    expect(screen.queryByText('DEBUG')).not.toBeInTheDocument();
  });
});
```

Note: in the test environment `VITE_COMMIT_SHA` is not set, so `COMMIT_SHA` resolves to `'dev'`. The `userEvent` import is already present from the previous `describe('App add-tag flow', ...)` block.

### Step 2: Run tests to verify they fail

```bash
npm -w @pbai/web test
```

Expected: 3 new tests FAIL — "DEBUG" is always in the DOM and SHA is not a button yet.

### Step 3: Implement the changes in App.tsx

**a) Add `showDebug` state** after the existing `useState` declarations (around line 24):

```tsx
const [showDebug, setShowDebug] = useState(false);
```

**b) Replace the SHA `<span>` with a `<button>`**

Find this line (inside the header row block, around line 151):
```tsx
<span className="font-mono text-[10px] text-pbai-dim">{COMMIT_SHA}</span>
```

Replace with:
```tsx
<button
  onClick={() => setShowDebug((v) => !v)}
  className="font-mono text-[10px] text-pbai-dim"
>
  {COMMIT_SHA}
</button>
```

**c) Wrap the DEBUG BOX in a conditional**

Find this block (around line 232):
```tsx
      {/* DEBUG BOX */}
      <div
        className="w-full px-4 pb-4 text-[10px] font-mono"
        style={{ color: '#888', borderTop: '1px solid #e0e0e0' }}
      >
```

Replace the opening so the entire block is conditional:
```tsx
      {/* DEBUG BOX */}
      {showDebug && (
      <div
        className="w-full px-4 pb-4 text-[10px] font-mono"
        style={{ color: '#888', borderTop: '1px solid #e0e0e0' }}
      >
```

And close the conditional after the debug box's closing `</div>` (after the `debugLog.map` block, around line 257):
```tsx
      </div>
      )}
```

### Step 4: Run tests to verify they all pass

```bash
npm -w @pbai/web test
```

Expected: all 101 tests pass (98 existing + 3 new).

### Step 5: Commit

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(ui): hide debug box by default, toggle via commit SHA click"
```
