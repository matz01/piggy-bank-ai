import { generateText } from 'ai';
import { z } from 'zod';
import { defaultModel } from '../providers/llm.js';
import type { ParseResponse } from '@pbai/shared';

const ParseSchema = z.object({
  titolo: z.string(),
  importo: z.number().nullable(),
  tag: z.array(z.string()),
  clarification: z.string().nullable(),
});

const SYSTEM = `Sei un assistente per il tracciamento delle spese personali.
Rispondi SOLO con un oggetto JSON valido, senza markdown, con questi campi:
- titolo: string (nome della spesa)
- importo: number oppure null (importo in euro, null se non specificato)
- tag: array di stringhe lowercase (categorie, es. ["bar", "cibo"])
- clarification: string oppure null (domanda se importo è null, altrimenti null)`;

function extractJson(text: string): unknown {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1] : text;
  return JSON.parse(raw.trim());
}

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
    return { clarification: object.clarification ?? "Puoi specificare l'importo?" };
  }

  return { titolo: object.titolo, importo: object.importo, tag: object.tag };
}
