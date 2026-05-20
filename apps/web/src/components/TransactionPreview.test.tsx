import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionPreview } from './TransactionPreview.js';

describe('TransactionPreview', () => {
  it('renders titolo and importo', () => {
    render(<TransactionPreview titolo="Caffè" importo={1.5} />);
    expect(screen.getByText('Caffè')).toBeInTheDocument();
    expect(screen.getByText('€ 1.50')).toBeInTheDocument();
  });

  it('formats importo with 2 decimal places', () => {
    render(<TransactionPreview titolo="Pranzo" importo={12} />);
    expect(screen.getByText('€ 12.00')).toBeInTheDocument();
  });
});
