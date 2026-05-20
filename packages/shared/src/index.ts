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
}

export type ParseResponse = ParseResult | ClarificationResult;

export interface ParseRequest {
  text: string;
  partial?: Partial<Pick<ParseResult, 'titolo' | 'importo' | 'tag'>>;
}

export function isClarification(r: ParseResponse): r is ClarificationResult {
  return 'clarification' in r;
}
