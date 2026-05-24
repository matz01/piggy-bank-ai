# SalvatoExplosion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After OK is pressed and the transaction is saved, display a fullscreen canvas particle explosion of the word "SALVATO" in gold, then reset the session to idle.

**Architecture:** New `SalvatoExplosion` component renders a `position: fixed` fullscreen canvas. App.tsx adds a `showExplosion` boolean state; `handleOk` sets it to true instead of calling `session.reset()` directly. The component calls `onDone` when all particles fade, which then resets the session.

**Tech Stack:** React + Canvas API (no new dependencies) + Vitest + @testing-library/react

---

## File Map

| Action | Path |
|--------|------|
| Create | `apps/web/src/components/SalvatoExplosion.tsx` |
| Create | `apps/web/src/components/SalvatoExplosion.test.tsx` |
| Modify | `apps/web/src/App.tsx` |

---

## Task 1: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/salvato-explosion
```

---

## Task 2: `SalvatoExplosion` component

**Files:**
- Create: `apps/web/src/components/SalvatoExplosion.test.tsx`
- Create: `apps/web/src/components/SalvatoExplosion.tsx`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/components/SalvatoExplosion.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SalvatoExplosion } from './SalvatoExplosion.js';

describe('SalvatoExplosion', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillText: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(400),
        width: 10,
        height: 10,
      })),
      fillRect: vi.fn(),
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      letterSpacing: '',
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a canvas element', () => {
    const { container } = render(<SalvatoExplosion onDone={vi.fn()} />);
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('calls onDone when no particles survive', () => {
    const onDone = vi.fn();
    render(<SalvatoExplosion onDone={onDone} />);
    expect(onDone).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

Run: `npm run test -w @pbai/web -- SalvatoExplosion`
Expected: FAIL — `Cannot find module './SalvatoExplosion.js'`

- [ ] **Step 3: Implement `SalvatoExplosion.tsx`**

Create `apps/web/src/components/SalvatoExplosion.tsx`:

```tsx
import { useEffect, useRef } from 'react';

interface Props {
  onDone: () => void;
}

export function SalvatoExplosion({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillStyle = '#c9a84c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.15em';
    ctx.fillText('SALVATO', cx, cy);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const buf = imageData.data;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      timeFade: number;
      r: number; g: number; b: number;
    };

    const particles: Particle[] = [];
    const step = 3;
    for (let y = 0; y < imageData.height; y += step) {
      for (let x = 0; x < imageData.width; x += step) {
        const idx = (y * imageData.width + x) * 4;
        if (buf[idx + 3] > 128) {
          const speed = Math.random() * 5 + 2;
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2.5 + 1,
            timeFade: 1,
            r: buf[idx], g: buf[idx + 1], b: buf[idx + 2],
          });
        }
      }
    }

    const maxRadius = Math.min(canvas.width, canvas.height) * 0.42;

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let anyAlive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.timeFade -= 0.016;

        const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        const distFade = Math.max(0, 1 - dist / maxRadius);
        const alpha = Math.min(distFade, Math.max(0, p.timeFade));

        if (alpha > 0) {
          anyAlive = true;
          ctx!.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          ctx!.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      if (anyAlive) {
        requestAnimationFrame(animate);
      } else {
        onDone();
      }
    }

    requestAnimationFrame(animate);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -w @pbai/web -- SalvatoExplosion`
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/SalvatoExplosion.tsx apps/web/src/components/SalvatoExplosion.test.tsx
git commit -m "feat(ui): add SalvatoExplosion canvas particle component"
```

---

## Task 3: Integrate into `App.tsx`

**Files:**
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Run all tests to establish baseline**

Run: `npm run test -w @pbai/web`
Expected: all tests PASS

- [ ] **Step 2: Update `App.tsx`**

Add import at the top (after existing imports):

```tsx
import { SalvatoExplosion } from './components/SalvatoExplosion.js';
```

Add state after the existing `useState` declarations (line ~19):

```tsx
const [showExplosion, setShowExplosion] = useState(false);
```

Replace the `handleOk` body — the last three lines change:

```tsx
  const handleOk = useCallback(async () => {
    if (!session.partial?.titolo || session.partial?.importo == null) return;

    const tag_ids = await resolveAndSaveTags(selectedTags);
    await saveTransaction({
      id: `${crypto.randomUUID()}-${Date.now()}`,
      titolo: session.partial.titolo,
      importo: session.partial.importo,
      data: Date.now(),
      tag_ids,
    });

    setShowExplosion(true);
  }, [session, selectedTags]);
```

Add `handleExplosionDone` after `handleCancel`:

```tsx
  const handleExplosionDone = useCallback(() => {
    setShowExplosion(false);
    session.reset();
    setSelectedTags([]);
    setMode('expense');
  }, [session]);
```

Add the component at the very end of the returned JSX, just before the closing `</div>` of the root element:

```tsx
      {showExplosion && <SalvatoExplosion onDone={handleExplosionDone} />}
```

- [ ] **Step 3: Run all tests to verify no regressions**

Run: `npm run test -w @pbai/web`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat(ui): trigger SalvatoExplosion after transaction save"
```
