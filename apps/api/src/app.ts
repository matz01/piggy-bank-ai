import { Hono } from 'hono';
import { cors } from 'hono/cors';
import parse from './routes/parse.js';
import transcribe from './routes/transcribe.js';

const app = new Hono();
app.use('/*', cors());
app.route('/parse', parse);
app.route('/transcribe', transcribe);

export default app;
