# Design: Add Tag (Aggiungi +)

**Date:** 2026-05-26
**Scope:** UI flow to manually add a tag to an expense during the preview state.

---

## Context

Tags are currently suggested by the AI during expense parsing and shown as toggleable chips in the preview state. There is no way to add a tag that the AI did not suggest. This feature adds an "Aggiungi +" chip that opens a minimal text-input mode for manual tag entry with autocomplete from existing tags.

---

## State Machine

New session state: `adding_tag`.

Transitions:
- `preview` → `adding_tag` — tap on "Aggiungi +" chip
- `adding_tag` → `preview` — confirm (✓) or cancel (X)

`selectedTags` lives in App.tsx and is unchanged by the state transition itself; the confirm handler appends the new tag.

---

## Components

### TagChips.tsx (modified)

Adds an "Aggiungi +" chip at the end of the tag list. Visually distinct from existing tag chips: neutral background, different border style (not the gold accent). Exposes a new optional prop `onAdd?: () => void`.

### AddTagInput.tsx (new)

Rendered in the content area when `session.state === 'adding_tag'`, replacing the TransactionPreview and TagChips entirely.

Layout:

```
[X]                              [✓]

        colazione               ← text input (lowercase forced)

        colazione  [→]          ← autocomplete suggestion (shown only when match exists)
```

Behaviour:
- Input auto-focused on mount (mobile keyboard opens immediately)
- Input value is lowercased on every keystroke
- Autocomplete: first alphabetical prefix-match among existing tag IDs; case-insensitive comparison
- `[→]` button: pastes the suggestion into the input field (does not confirm)
- `[✓]` button: calls `onConfirm(tag)` with the trimmed lowercase value; disabled when input is empty
- `[X]` button: calls `onCancel()`

Props:
```ts
interface Props {
  existingTagIds: string[];   // all tag IDs from DB, for autocomplete
  onConfirm: (tag: string) => void;
  onCancel: () => void;
}
```

### App.tsx (modified)

- Handles `adding_tag` state: loads `readAllTagIds()` when entering the state, stores result in a local `useState<string[]>` (`allTagIds`), passes it to `AddTagInput`
- `onConfirm(tag)`: adds tag to `selectedTags` (dedup: skip if already present), calls `session.setState('preview')`
- `onCancel()`: calls `session.setState('preview')`
- TagChips receives new prop `onAdd={() => { loadTagIds(); session.setState('adding_tag'); }}`

---

## Data Flow

1. User taps "Aggiungi +" in preview state
2. App.tsx calls `readAllTagIds()`, stores result locally, sets state to `adding_tag`
3. `AddTagInput` mounts, keyboard opens
4. User types → input lowercased → first alphabetical prefix-match shown below
5. Optional: user taps `[→]` → suggestion pasted into input
6. User taps `[✓]` → App.tsx adds tag to `selectedTags` (if not duplicate), sets state to `preview`
7. Preview resumes with updated tag chips

---

## Edge Cases

- **Duplicate tag**: if the typed tag is already in `selectedTags`, it is not added again (silent dedup on client)
- **New tag (not in DB)**: allowed — the tag will be created in IndexedDB when the expense is saved via the existing `resolveAndSaveTags` flow
- **No autocomplete match**: `[→]` not shown; user types freely
- **Empty input**: `[✓]` is disabled; no confirm possible
- **Multiple tags**: user can add one tag per `adding_tag` session; to add another, they return to preview and tap "Aggiungi +" again

---

## Out of Scope

- Frequency-based autocomplete ordering (future: requires `readAllTags()` and sorting by `frequenza_uso`)
- Tag memory by title (separate spec: pre-populate tags based on historical expenses with the same title)
- Tag validation (length, special characters)

---

## Testing

- **`TagChips.test.tsx`**: "Aggiungi +" chip renders and calls `onAdd` on click
- **`AddTagInput.test.tsx`**: input is lowercased; prefix match shown; `[→]` pastes suggestion; `[✓]` calls `onConfirm` with correct tag; `[X]` calls `onCancel`; `[✓]` disabled when empty; duplicate not added
- **`App.test.tsx`**: state transition `preview → adding_tag → preview`; `selectedTags` updated on confirm; unchanged on cancel
