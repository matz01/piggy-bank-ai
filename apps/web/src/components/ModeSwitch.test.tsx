import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSwitch } from './ModeSwitch.js';

describe('ModeSwitch', () => {
  it('renders expense and income pills', () => {
    render(<ModeSwitch mode="expense" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Spesa')).toBeInTheDocument();
    expect(screen.getByLabelText('Entrata')).toBeInTheDocument();
  });

  it('marks expense pill as pressed when mode is expense', () => {
    render(<ModeSwitch mode="expense" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Spesa')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Entrata')).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks income pill as pressed when mode is income', () => {
    render(<ModeSwitch mode="income" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Entrata')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Spesa')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with income when income pill is clicked', async () => {
    const onChange = vi.fn();
    render(<ModeSwitch mode="expense" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Entrata'));
    expect(onChange).toHaveBeenCalledWith('income');
  });

  it('calls onChange with expense when expense pill is clicked', async () => {
    const onChange = vi.fn();
    render(<ModeSwitch mode="income" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Spesa'));
    expect(onChange).toHaveBeenCalledWith('expense');
  });
});
