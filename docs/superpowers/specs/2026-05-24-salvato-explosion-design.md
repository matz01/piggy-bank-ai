# SalvatoExplosion — Design Spec

**Date:** 2026-05-24  
**Feature:** Text particle explosion triggered after a successful transaction save

---

## Goal

After the user presses OK and the transaction is saved to IndexedDB, display a fullscreen particle explosion of the word "SALVATO" in gold, then reset the session to idle when the animation ends.

---

## Architecture

Single new component `SalvatoExplosion` rendered conditionally in `App.tsx`. No new state management layer — one boolean `showExplosion` in `App` is sufficient.

**Files changed:**
| Action | Path |
|--------|------|
| Create | `apps/web/src/components/SalvatoExplosion.tsx` |
| Modify | `apps/web/src/App.tsx` |

---

## Component: `SalvatoExplosion`

**Props:**
```ts
interface Props {
  onDone: () => void;
}
```

**Rendering:** A `<canvas>` with `position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 50`. The `pointer-events: none` ensures touch events pass through to the app underneath (not that it matters since the session resets after, but avoids any accidental block).

**Animation lifecycle (on mount):**
1. Draw "SALVATO" centered on canvas — Inter 500, 18px, uppercase, letter-spacing 0.15em, color `#c9a84c`
2. Capture pixel data with `getImageData`
3. Clear canvas, build particle array from opaque pixels (step = 3 for performance)
4. Run `requestAnimationFrame` loop

**Particle structure:**
```ts
{ x, y, originX, originY, vx, vy, size, alpha }
```
- `vx`, `vy`: random direction, speed 2–7px/frame
- `vy` gets gravity: `+= 0.1` per frame
- `originX`, `originY`: captured at particle creation (canvas center)

**Alpha fade formula** — dual fade to ensure invisibility before canvas edge:
```
distFromOrigin = sqrt((x - originX)² + (y - originY)²)
maxRadius = min(canvasW, canvasH) * 0.42
distanceFade = max(0, 1 - distFromOrigin / maxRadius)
timeFade -= 0.016 per frame
alpha = min(distanceFade, timeFade)
```
This guarantees particles are fully transparent well before reaching any canvas border.

**End condition:** when all particles have `alpha <= 0`, call `props.onDone()` and the component unmounts.

---

## App.tsx changes

Replace current `session.reset()` inside `handleOk` with:
```ts
setShowExplosion(true);
```

Add state: `const [showExplosion, setShowExplosion] = useState(false)`

Add handler passed to component:
```ts
const handleExplosionDone = useCallback(() => {
  setShowExplosion(false);
  session.reset();
  setSelectedTags([]);
  setMode('expense');
}, [session]);
```

Render in JSX (at root level, outside all other containers):
```tsx
{showExplosion && <SalvatoExplosion onDone={handleExplosionDone} />}
```

---

## Testing

No automated test for the canvas animation itself (visual/timing-dependent). The component is tested indirectly:
- `handleOk` in App: verify `showExplosion` is set to `true` after save (existing App test patterns)
- `SalvatoExplosion`: a smoke test verifying it mounts a canvas element and calls `onDone` (mock `requestAnimationFrame`)

---

## Out of scope

- Sound effects
- Haptic feedback
- Configurable text or color
- Reuse for other events
