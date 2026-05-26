import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTagInput } from './AddTagInput.js';

describe('AddTagInput', () => {
  it('auto-focuses the input on mount', () => {
    render(<AddTagInput existingTagIds={[]} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
  });

  it('forces input value to lowercase', async () => {
    render(<AddTagInput existingTagIds={[]} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'CIBO');
    expect(screen.getByRole('textbox')).toHaveValue('cibo');
  });

  it('shows autocomplete suggestion on prefix match', async () => {
    render(<AddTagInput existingTagIds={['colazione', 'cibo']} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'col');
    expect(screen.getByText('colazione')).toBeInTheDocument();
    expect(screen.getByLabelText('Accetta suggerimento')).toBeInTheDocument();
  });

  it('does not show suggestion when no prefix match', async () => {
    render(<AddTagInput existingTagIds={['cibo']} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'bar');
    expect(screen.queryByLabelText('Accetta suggerimento')).not.toBeInTheDocument();
  });

  it('does not show suggestion when input exactly matches an existing tag', async () => {
    render(<AddTagInput existingTagIds={['cibo']} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'cibo');
    expect(screen.queryByLabelText('Accetta suggerimento')).not.toBeInTheDocument();
  });

  it('pastes suggestion into input on → click', async () => {
    render(<AddTagInput existingTagIds={['colazione']} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'col');
    await userEvent.click(screen.getByLabelText('Accetta suggerimento'));
    expect(screen.getByRole('textbox')).toHaveValue('colazione');
  });

  it('calls onConfirm with the typed tag on ✓ click', async () => {
    const onConfirm = vi.fn();
    render(<AddTagInput existingTagIds={[]} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'gelato');
    await userEvent.click(screen.getByLabelText('Conferma'));
    expect(onConfirm).toHaveBeenCalledWith('gelato');
  });

  it('disables the confirm button when input is empty', () => {
    render(<AddTagInput existingTagIds={[]} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Conferma')).toBeDisabled();
  });

  it('calls onCancel on X click', async () => {
    const onCancel = vi.fn();
    render(<AddTagInput existingTagIds={[]} onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByLabelText('Annulla'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('picks the first alphabetical match when multiple prefixes match', async () => {
    render(<AddTagInput existingTagIds={['colazione', 'cola']} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'col');
    expect(screen.getByText('cola')).toBeInTheDocument();
  });
});
