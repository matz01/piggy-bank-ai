import { Hono } from 'hono';
import { parseExpense } from '../agents/parserAgent.js';
import { classifyIntent } from '../agents/classifierAgent.js';
import { queryExpenses } from '../agents/queryAgent.js';
import type { ParseRequest } from '@pbai/shared';

const app = new Hono();

app.post('/', async (c) => {
  const body: ParseRequest = await c.req.json();

  if (!body.text || typeof body.text !== 'string') {
    return c.json({ error: 'text is required' }, 400);
  }

  let intent: 'expense' | 'query' = 'expense';
  try {
    ({ intent } = await classifyIntent(body.text));
  } catch {
    // classifier failure: fall back to expense intent
  }

  try {
    if (intent === 'query') {
      const result = await queryExpenses(body.text, body.tags ?? [], body.today ?? Date.now());
      return c.json(result);
    }

    const result = await parseExpense(body.text, body.partial);
    return c.json(result);
  } catch (err) {
    console.error('agent error:', err);
    return c.json({ error: 'agent failed', detail: String(err) }, 500);
  }
});

export default app;
