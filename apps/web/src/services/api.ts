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

export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', audio, 'audio');
  const res = await fetch(`${API_URL}/transcribe`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`transcribe failed: ${res.status}`);
  const data = await res.json();
  return data.text;
}
