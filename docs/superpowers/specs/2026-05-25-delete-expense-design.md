# Delete Expense — Design

**Date:** 2026-05-25
**Scope:** Delete a transaction from QueryDetailView via long press + modal confirm

---

## Feature Summary

The user can delete a saved expense while browsing the detail list (QueryDetailView). Interaction: long press (~600ms) on a list item → modal confirm dialog → delete confirmed or cancelled.

---

## UX Flow

1. User is in `query_detail` state, viewing the transaction list.
2. User holds a list item for ≥600ms → modal dialog appears.
3. Modal shows: transaction `titolo` + `importo` + [Annulla] [Elimina].
4. **Confirm (Elimina):** transaction deleted from IndexedDB, row removed from local list, modal closes. User stays in QueryDetailView.
5. **Cancel (Annulla):** modal closes, no changes.
6. If the user lifts the finger or moves the pointer before 600ms, nothing happens.

---

## Data Layer — `deleteTransaction(id: string)`

New function in `apps/web/src/services/db.ts`.

**Steps (sequential):**
1. Read the transaction from `spese` store to get its `tag_ids`.
2. Delete the transaction from `spese` store by `id`.
3. For each `tag_id` in the transaction: fetch tag via `getTag`, if `frequenza_uso > 0` decrement by 1, save via `saveTag`. If `frequenza_uso` is already 0, leave it at 0 (no negative values). Tags are never deleted.

Uses existing `getTag` / `saveTag` helpers — no new DB primitives needed.

---

## UI — `QueryDetailView.tsx`

### Local state additions

```
deletingTransaction: Transaction | null  (default: null)
longPressTimer: ReturnType<typeof setTimeout> | null  (ref, not state)
```

### Long press detection (per list item)

- `onPointerDown`: start 600ms timer → on fire, `setDeletingTransaction(t)`
- `onPointerUp` / `onPointerLeave`: clear timer (no-op if not fired)

### Modal

Rendered when `deletingTransaction !== null`. Positioned as a fixed overlay over the view content (not full screen — same pattern as the warm-minimalism design). Shows:

- Small label: "Elimina"
- `titolo` in medium weight
- `importo` in red
- Two buttons side by side: [Annulla] (border, muted) / [Elimina] (red filled)

### On confirm

```
await deleteTransaction(deletingTransaction.id)
setTransactions(prev => prev.filter(t => t.id !== deletingTransaction.id))
setDeletingTransaction(null)
```

### On cancel

```
setDeletingTransaction(null)
```

---

## Files Modified

| File | Change |
|---|---|
| `apps/web/src/services/db.ts` | Add `deleteTransaction(id: string): Promise<void>` |
| `apps/web/src/services/db.test.ts` | Add tests for `deleteTransaction` |
| `apps/web/src/components/QueryDetailView.tsx` | Long press + modal + delete handler |
| `apps/web/src/components/QueryDetailView.test.tsx` | Tests for long press, modal, confirm, cancel |

---

## Testing

### `db.test.ts`

- `deleteTransaction` removes the transaction from `spese`
- `deleteTransaction` decrements `frequenza_uso` for each tag in the transaction
- `deleteTransaction` does not decrement below 0 (tag with `frequenza_uso: 0` stays at 0)
- `deleteTransaction` is a no-op if the `id` does not exist

### `QueryDetailView.test.tsx`

- Long press (pointerdown held > 600ms) shows the modal with the item's titolo
- Pointer released before 600ms does not show the modal
- Clicking "Elimina" in the modal calls `deleteTransaction` and removes the item from the list
- Clicking "Annulla" closes the modal without calling `deleteTransaction`

---

## Out of Scope

- Undo / restore after delete
- Bulk delete
- Delete from any view other than QueryDetailView
- Updating `QueryResultView` total automatically after delete (user must navigate back and re-enter)
