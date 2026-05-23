import { generateText } from 'ai';
import { z } from 'zod';
import { defaultModel } from '../providers/llm.js';
import type { QueryResult } from '@pbai/shared';
import { extractJson } from './utils.js';

const QuerySchema = z.object({
  tag_ids: z.array(z.string()),
  date_from: z.number(),
  date_to: z.number(),
  clarification: z.string().nullable(),
});

function buildSystem(tags: string[], today: number): string {
  return `Sei un assistente per l'analisi delle finanze personali.
Timestamp corrente (ms): ${today}. Tag disponibili: [${tags.join(', ')}].
Rispondi SOLO con JSON valido senza markdown:
- tag_ids: array di stringhe (solo tag dalla lista che corrispondono alla richiesta)
- date_from: number (timestamp ms, inizio del periodo)
- date_to: number (timestamp ms, fine del periodo)
- clarification: string oppure null (domanda se nessun tag corrisponde, altrimenti null)
Periodi comuni: "questa settimana" = today - 7*86400000, "questo mese" = primo giorno del mese corrente, "ieri" = today - 86400000.`;
}

export async function queryExpenses(
  text: string,
  tags: string[],
  today: number
): Promise<QueryResult | { clarification: string }> {
  const { text: raw } = await generateText({
    model: defaultModel,
    system: buildSystem(tags, today),
    prompt: text,
    maxRetries: 0,
  });

  const object = QuerySchema.parse(extractJson(raw));

  if (object.clarification !== null) {
    return { clarification: object.clarification };
  }

  return { tag_ids: object.tag_ids, date_from: object.date_from, date_to: object.date_to };
}
