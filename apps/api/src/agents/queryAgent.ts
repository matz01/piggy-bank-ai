import { generateText } from 'ai';
import { z } from 'zod';
import { defaultModel } from '../providers/llm.js';
import type { QueryResult } from '@pbai/shared';
import { extractJson } from './utils.js';

const QuerySchema = z.object({
  tag_ids: z.array(z.string()),
  date_from: z.number().nullable(),
  date_to: z.number().nullable(),
  title_query: z.string().nullable(),
});

function buildSystem(tags: string[], today: number): string {
  return `Sei un assistente per l'analisi delle finanze personali.
Timestamp corrente (ms): ${today}. Tag disponibili: [${tags.join(', ')}].
Rispondi SOLO con JSON valido senza markdown:
- tag_ids: array di stringhe (solo tag dalla lista che corrispondono al concetto richiesto)
- date_from: number (timestamp ms, inizio del periodo)
- date_to: number (timestamp ms, fine del periodo)
- title_query: string oppure null (il termine specifico cercato se NON è nella lista tag)
Prima individua il "concetto" nella query (es. in "quanto ho speso in sushi" il concetto è "sushi").
Regole:
  il concetto è un tag esatto nella lista → tag_ids: [tag], title_query: null
  il concetto NON è nella lista tag → tag_ids: [], title_query: "<concetto>"
  nessun concetto specifico → tag_ids: [], title_query: null
Esempio: query "quanto ho speso in spritz" con tag [bar, cibo] → {"tag_ids":[],"date_from":...,"date_to":...,"title_query":"spritz"}
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
    date_from: object.date_from ?? 0,
    date_to: object.date_to ?? today,
    title_query: object.title_query,
  };
}
