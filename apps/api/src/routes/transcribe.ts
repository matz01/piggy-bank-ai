import { Hono } from 'hono';
import Groq from 'groq-sdk';

const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.formData();
  const file = body.get('file');
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'file is required' }, 400);
  }
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      language: 'it',
    });
    return c.json({ text: result.text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'transcription failed';
    return c.json({ error: msg }, 500);
  }
});

export default app;
