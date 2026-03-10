'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const parteSchema = z.object({
  id: z.string().optional(),
  codice: z.string().min(1, 'Il codice è obbligatorio'),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  descrizione: z.string().optional(),
  unitaMisura: z.string().min(1, "L'unità di misura è obbligatoria"),
  quantitaMinima: z.coerce.number().min(0, 'La quantità minima deve essere >= 0'),
  costoUnitario: z.coerce.number().min(0, 'Il costo unitario deve essere >= 0').optional(),
  note: z.string().optional(),
  attivo: z.boolean().default(true),
});

export async function salvaParte(data: z.infer<typeof parteSchema>) {
  try {
    const parsedData = parteSchema.parse(data);
    
    // Check if codice already exists
    const existingParte = await prisma.parte.findUnique({
      where: { codice: parsedData.codice }
    });

    if (existingParte && existingParte.id !== parsedData.id) {
      return { success: false, error: 'Esiste già una parte con questo codice.' };
    }

    if (parsedData.id) {
      // Update
      await prisma.parte.update({
        where: { id: parsedData.id },
        data: {
          codice: parsedData.codice,
          nome: parsedData.nome,
          descrizione: parsedData.descrizione,
          unitaMisura: parsedData.unitaMisura,
          quantitaMinima: parsedData.quantitaMinima,
          costoUnitario: parsedData.costoUnitario,
          note: parsedData.note,
          attivo: parsedData.attivo,
        }
      });
    } else {
      // Create
      await prisma.parte.create({
        data: {
          codice: parsedData.codice,
          nome: parsedData.nome,
          descrizione: parsedData.descrizione,
          unitaMisura: parsedData.unitaMisura,
          quantitaMinima: parsedData.quantitaMinima,
          costoUnitario: parsedData.costoUnitario,
          note: parsedData.note,
          attivo: parsedData.attivo,
          quantitaDisponibile: 0, // Inizializza a 0
        }
      });
    }

    revalidatePath('/parti');
    return { success: true };
  } catch (error) {
    console.error('Errore durante il salvataggio della parte:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dati non validi.' };
    }
    return { success: false, error: 'Si è verificato un errore imprevisto.' };
  }
}
