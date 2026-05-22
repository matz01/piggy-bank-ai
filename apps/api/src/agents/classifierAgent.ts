import { generateText } from 'ai';
import { defaultModel } from '../providers/llm.js';

const SYSTEM = `Classifica l'intenzione dell'utente in due categorie.
Rispondi SOLO con una parola: "expense" oppure "query".
expense: l'utente registra una spesa o un'entrata (es. "caffè 1.50", "stipendio 2000")
query: l'utente interroga la cronologia delle transazioni (es. "quanto ho speso", "mostrami le spese")`;

export async function classifyIntent(text: string): Promise<{ intent: 'expense' | 'query' }> {
  const { text: raw } = await generateText({
    model: defaultModel,
    system: SYSTEM,
    prompt: text,
    maxRetries: 0,
  });
  const intent = raw.trim().toLowerCase();
  return { intent: intent === 'query' ? 'query' : 'expense' };
}
