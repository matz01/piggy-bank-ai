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

  it('cancels animation on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(<SalvatoExplosion onDone={vi.fn()} />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
