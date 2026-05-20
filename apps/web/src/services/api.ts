import type { ParseRequest, ParseResponse } from '@pbai/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function parse(req: ParseRequest): Promise<ParseResponse> {
  const res = await fetch(`${API_URL}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return res.json();
}
