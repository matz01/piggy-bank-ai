import { Hono } from 'hono';
import { parseExpense } from '../agents/parserAgent.js';
import type { ParseRequest } from '@pbai/shared';

const app = new Hono();

app.post('/', async (c) => {
  const body: ParseRequest = await c.req.json();

  if (!body.text || typeof body.text !== 'string') {
    return c.json({ error: 'text is required' }, 400);
  }

  const result = await parseExpense(body.text, body.partial);
  return c.json(result);
});

export default app;
