import { generateObject } from 'ai';
import { z } from 'zod';
import { defaultModel } from '../providers/llm.js';
import type { ParseResponse } from '@pbai/shared';

const ParseSchema = z.object({
  titolo: z.string().describe('Nome della spesa'),
  importo: z.number().nullable().describe('Importo in euro. null se non specificato'),
  tag: z.array(z.string()).describe('Categorie lowercase, es. ["bar", "cibo"]'),
  clarification: z.string().nullable().describe('Domanda da porre se importo è null, altrimenti null'),
});

export async function parseExpense(
  text: string,
  partial?: Partial<{ titolo: string; importo: number; tag: string[] }>
): Promise<ParseResponse> {
  const prompt =
    partial && Object.keys(partial).length > 0
      ? `Informazioni già note: ${JSON.stringify(partial)}. L'utente ha aggiunto: "${text}". Completa i dati mancanti.`
      : `Estrai i dati di questa spesa: "${text}"`;

  const { object } = await generateObject({
    model: defaultModel,
    schema: ParseSchema,
    system:
      'Sei un assistente per il tracciamento delle spese personali. Estrai titolo, importo e categorie da descrizioni in italiano.',
    prompt,
  });

  if (object.importo === null) {
    return { clarification: object.clarification ?? "Puoi specificare l'importo?" };
  }

  return { titolo: object.titolo, importo: object.importo, tag: object.tag };
}
