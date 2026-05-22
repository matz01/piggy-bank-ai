import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MicButton } from './MicButton.js';

describe('MicButton', () => {
  it('renders in idle state', () => {
    render(<MicButton sessionState="idle" onPress={vi.fn()} onRelease={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onPress on pointer down', async () => {
    const onPress = vi.fn();
    render(<MicButton sessionState="idle" onPress={onPress} onRelease={vi.fn()} />);
    await userEvent.pointer({ target: screen.getByRole('button'), keys: '[MouseLeft>]' });
    expect(onPress).toHaveBeenCalled();
  });

  it('calls onRelease on pointer up', async () => {
    const onRelease = vi.fn();
    render(<MicButton sessionState="idle" onPress={vi.fn()} onRelease={onRelease} />);
    await userEvent.pointer([
      { target: screen.getByRole('button'), keys: '[MouseLeft>]' },
      { keys: '[/MouseLeft]' },
    ]);
    expect(onRelease).toHaveBeenCalled();
  });

  it('shows processing state visually', () => {
    render(<MicButton sessionState="processing" onPress={vi.fn()} onRelease={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
