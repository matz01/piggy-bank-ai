import { Hono } from 'hono';

const app = new Hono();

app.post('/', async (c) => {
  return c.json({ error: 'not implemented' }, 501);
});

export default app;
