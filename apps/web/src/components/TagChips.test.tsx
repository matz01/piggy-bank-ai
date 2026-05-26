import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagChips } from './TagChips.js';

describe('TagChips', () => {
  it('renders all tags as buttons', () => {
    render(<TagChips tags={['bar', 'cibo']} selected={['bar', 'cibo']} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('deselects a tag on click', async () => {
    const onChange = vi.fn();
    render(<TagChips tags={['bar', 'cibo']} selected={['bar', 'cibo']} onChange={onChange} />);
    await userEvent.click(screen.getByText('bar'));
    expect(onChange).toHaveBeenCalledWith(['cibo']);
  });

  it('re-selects a deselected tag on click', async () => {
    const onChange = vi.fn();
    render(<TagChips tags={['bar', 'cibo']} selected={['cibo']} onChange={onChange} />);
    await userEvent.click(screen.getByText('bar'));
    expect(onChange).toHaveBeenCalledWith(['cibo', 'bar']);
  });

  it('renders Aggiungi + chip when onAdd is provided', () => {
    render(<TagChips tags={['bar']} selected={['bar']} onChange={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByText('Aggiungi +')).toBeInTheDocument();
  });

  it('calls onAdd when Aggiungi + chip is clicked', async () => {
    const onAdd = vi.fn();
    render(<TagChips tags={['bar']} selected={['bar']} onChange={vi.fn()} onAdd={onAdd} />);
    await userEvent.click(screen.getByText('Aggiungi +'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('does not render Aggiungi + chip when onAdd is not provided', () => {
    render(<TagChips tags={['bar']} selected={['bar']} onChange={vi.fn()} />);
    expect(screen.queryByText('Aggiungi +')).not.toBeInTheDocument();
  });
});
