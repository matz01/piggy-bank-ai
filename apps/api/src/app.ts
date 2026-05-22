import { Hono } from 'hono';
import { cors } from 'hono/cors';
import parse from './routes/parse.js';

const app = new Hono();
app.use('/*', cors());
app.route('/parse', parse);

export default app;
