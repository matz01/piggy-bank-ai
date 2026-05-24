export interface Transaction {
  id: string;
  titolo: string;
  importo: number;
  data: number;
  tag_ids: string[];
}

export interface Tag {
  id: string;
  nome: string;
  frequenza_uso: number;
}

export interface ParseResult {
  titolo: string;
  importo: number;
  tag: string[];
}

export interface ClarificationResult {
  clarification: string;
  partial: Partial<Pick<ParseResult, 'titolo' | 'importo' | 'tag'>>;
}

export interface QueryResult {
  tag_ids: string[];
  date_from: number;
  date_to: number;
}

export type ParseResponse = ParseResult | ClarificationResult | QueryResult;

export interface ParseRequest {
  text: string;
  partial?: Partial<Pick<ParseResult, 'titolo' | 'importo' | 'tag'>>;
  mode?: 'expense' | 'income';
  tags?: string[];
  today?: number;
}

export function isClarification(r: ParseResponse): r is ClarificationResult {
  return 'clarification' in r;
}

export function isQueryResult(r: ParseResponse): r is QueryResult {
  return 'tag_ids' in r;
}
