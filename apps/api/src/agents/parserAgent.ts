import { generateText } from 'ai';
import { z } from 'zod';
import { defaultModel } from '../providers/llm.js';
import type { ParseResponse } from '@pbai/shared';
import { extractJson } from './utils.js';

const ParseSchema = z.object({
  titolo: z.string().nullable(),
  importo: z.number().nullable(),
  tag: z.array(z.string()),
  clarification: z.string().nullable(),
});

const SYSTEM = `Sei un assistente per il tracciamento delle finanze personali.
Rispondi SOLO con un oggetto JSON valido, senza markdown, con questi campi:
- titolo: string oppure null (nome dell'operazione, null se non specificato)
- importo: number oppure null (importo in euro, null se non specificato)
- tag: array di stringhe lowercase (categorie, es. ["bar", "cibo"])
- clarification: string oppure null (domanda se titolo o importo sono null, altrimenti null)`;

export async function parseExpense(
  text: string,
  partial?: Partial<{ titolo: string; importo: number; tag: string[] }>
): Promise<ParseResponse> {
  const prompt =
    partial && Object.keys(partial).length > 0
      ? `Informazioni già note: ${JSON.stringify(partial)}. L'utente ha aggiunto: "${text}". Completa i dati mancanti.`
      : `Estrai i dati di questa spesa: "${text}"`;

  const { text: raw } = await generateText({
    model: defaultModel,
    system: SYSTEM,
    prompt,
    maxRetries: 0,
  });

  const object = ParseSchema.parse(extractJson(raw));

  if (object.importo === null) {
    return {
      clarification: object.clarification ?? "Puoi specificare l'importo?",
      partial: { titolo: object.titolo ?? undefined, tag: object.tag },
    };
  }

  if (!object.titolo) {
    return {
      clarification: object.clarification ?? 'Per cosa hai speso?',
      partial: { importo: object.importo, tag: object.tag },
    };
  }

  return { titolo: object.titolo, importo: object.importo, tag: object.tag };
}
