import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TransactionPreview } from './TransactionPreview.js';

describe('TransactionPreview', () => {
  it('renders titolo', () => {
    const { container } = render(<TransactionPreview titolo="Caffè" importo={1.5} mode="expense" />);
    expect(container.textContent).toContain('Caffè');
  });

  it('renders expense sign, integer, decimal, and euro symbol', () => {
    const { container } = render(<TransactionPreview titolo="Caffè" importo={1.5} mode="expense" />);
    expect(container.textContent).toContain('−');
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('.50');
    expect(container.textContent).toContain('€');
  });

  it('formats importo with 2 decimal places', () => {
    const { container } = render(<TransactionPreview titolo="Pranzo" importo={12} mode="expense" />);
    expect(container.textContent).toContain('12');
    expect(container.textContent).toContain('.00');
  });

  it('renders income sign for income mode', () => {
    const { container } = render(<TransactionPreview titolo="Stipendio" importo={1500} mode="income" />);
    expect(container.textContent).toContain('+');
  });
});
