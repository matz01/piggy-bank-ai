import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClarificationPrompt } from './ClarificationPrompt.js';

describe('ClarificationPrompt', () => {
  it('renders the clarification question', () => {
    render(<ClarificationPrompt question="Quanto hai speso?" />);
    expect(screen.getByText('Quanto hai speso?')).toBeInTheDocument();
  });
});
