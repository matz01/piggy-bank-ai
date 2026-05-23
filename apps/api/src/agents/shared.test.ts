import { describe, it, expect } from 'vitest';
import { isClarification, isQueryResult } from '@pbai/shared';
import type { ParseResult, ClarificationResult, QueryResult } from '@pbai/shared';

const parseResult: ParseResult = { titolo: 'Caffè', importo: 1.5, tag: ['bar'] };
const clarificationResult: ClarificationResult = { clarification: 'Quanto?' };
const queryResult: QueryResult = { tag_ids: ['bar'], date_from: 0, date_to: 1 };

describe('isClarification', () => {
  it('returns true for ClarificationResult', () => {
    expect(isClarification(clarificationResult)).toBe(true);
  });
  it('returns false for ParseResult', () => {
    expect(isClarification(parseResult)).toBe(false);
  });
  it('returns false for QueryResult', () => {
    expect(isClarification(queryResult)).toBe(false);
  });
});

describe('isQueryResult', () => {
  it('returns true for QueryResult', () => {
    expect(isQueryResult(queryResult)).toBe(true);
  });
  it('returns false for ParseResult', () => {
    expect(isQueryResult(parseResult)).toBe(false);
  });
  it('returns false for ClarificationResult', () => {
    expect(isQueryResult(clarificationResult)).toBe(false);
  });
});
