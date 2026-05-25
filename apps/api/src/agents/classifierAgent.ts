import { generateText } from 'ai';
import { defaultModel } from '../providers/llm.js';

const SYSTEM = `Classifica l'intenzione dell'utente in due categorie.
Rispondi SOLO con una parola: "expense" oppure "query".
expense: l'utente sta registrando qualcosa che ha comprato, pagato o consumato (con o senza importo).
  Esempi: "caffè 1.50", "negroni 8 euro", "ho pagato 12 euro di pizza", "stipendio 2000", "pranzo 9", "ho preso un caffè", "gelato", "taxi"
query: l'utente vuole interrogare la cronologia delle spese passate — sempre una domanda o richiesta di riepilogo.
  Esempi: "quanto ho speso", "mostrami le spese", "totale bar questo mese", "cosa ho speso questa settimana", "spese di ieri"
Regola: le domande sulla cronologia (quanto, cosa, mostrami, totale) → query. Tutto il resto → expense.`;

export async function classifyIntent(text: string): Promise<{ intent: 'expense' | 'query' }> {
  const { text: raw } = await generateText({
    model: defaultModel,
    system: SYSTEM,
    prompt: text,
    maxTokens: 10,
    maxRetries: 0,
  });
  const intent = raw.trim().toLowerCase();
  return { intent: intent === 'query' ? 'query' : 'expense' };
}
