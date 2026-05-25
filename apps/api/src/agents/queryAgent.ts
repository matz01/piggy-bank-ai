import { generateText } from 'ai';
import { z } from 'zod';
import { defaultModel } from '../providers/llm.js';
import type { QueryResult } from '@pbai/shared';
import { extractJson } from './utils.js';

const QuerySchema = z.object({
  tag_ids: z.array(z.string()),
  date_from: z.number(),
  date_to: z.number(),
  title_query: z.string().nullable(),
});

function buildSystem(tags: string[], today: number): string {
  return `Sei un assistente per l'analisi delle finanze personali.
Timestamp corrente (ms): ${today}. Tag disponibili: [${tags.join(', ')}].
Rispondi SOLO con JSON valido senza markdown:
- tag_ids: array di stringhe (solo tag dalla lista che corrispondono al concetto richiesto)
- date_from: number (timestamp ms, inizio del periodo)
- date_to: number (timestamp ms, fine del periodo)
- title_query: string oppure null
Regole per title_query:
  Se il concetto corrisponde a un tag → tag_ids: [tag], title_query: null
  Se il concetto NON corrisponde a nessun tag → tag_ids: [], title_query: <concetto>
  Se non c'è nessun concetto specifico → tag_ids: [], title_query: null
Periodi comuni: "questa settimana" = today - 7*86400000, "questo mese" = primo giorno del mese corrente, "ieri" = today - 86400000.`;
}

export async function queryExpenses(
  text: string,
  tags: string[],
  today: number
): Promise<QueryResult> {
  const { text: raw } = await generateText({
    model: defaultModel,
    system: buildSystem(tags, today),
    prompt: text,
    maxRetries: 0,
  });

  const object = QuerySchema.parse(extractJson(raw));
  return {
    tag_ids: object.tag_ids,
    date_from: object.date_from,
    date_to: object.date_to,
    title_query: object.title_query,
  };
}
