'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const prodottoSchema = z.object({
  id: z.string().optional(),
  codice: z.string().min(1, 'Il codice è obbligatorio'),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  descrizione: z.string().optional(),
  categoria: z.string().optional(),
  unitaMisura: z.string().min(1, 'L\'unità di misura è obbligatoria'),
  quantitaMinima: z.coerce.number().min(0, 'La quantità minima deve essere >= 0'),
  prezzoVendita: z.coerce.number().min(0, 'Il prezzo di vendita deve essere >= 0'),
  note: z.string().optional(),
  attivo: z.boolean().default(true),
});

export async function salvaProdotto(data: z.infer<typeof prodottoSchema>) {
  try {
    const validatedData = prodottoSchema.parse(data);

    // Check for duplicate code
    const existingProdotto = await prisma.prodotto.findUnique({
      where: { codice: validatedData.codice },
    });

    if (existingProdotto && existingProdotto.id !== validatedData.id) {
      return { success: false, error: 'Un prodotto con questo codice esiste già.' };
    }

    if (validatedData.id) {
      // Update
      await prisma.prodotto.update({
        where: { id: validatedData.id },
        data: {
          codice: validatedData.codice,
          nome: validatedData.nome,
          descrizione: validatedData.descrizione,
          categoria: validatedData.categoria,
          unitaMisura: validatedData.unitaMisura,
          quantitaMinima: validatedData.quantitaMinima,
          prezzoVendita: validatedData.prezzoVendita,
          note: validatedData.note,
          attivo: validatedData.attivo,
        },
      });
    } else {
      // Create
      await prisma.prodotto.create({
        data: {
          codice: validatedData.codice,
          nome: validatedData.nome,
          descrizione: validatedData.descrizione,
          categoria: validatedData.categoria,
          unitaMisura: validatedData.unitaMisura,
          quantitaMinima: validatedData.quantitaMinima,
          prezzoVendita: validatedData.prezzoVendita,
          note: validatedData.note,
          attivo: validatedData.attivo,
          quantitaDisponibile: 0, // Initial stock is 0
        },
      });
    }

    revalidatePath('/prodotti');
    return { success: true };
  } catch (error) {
    console.error('Error saving prodotto:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dati non validi. Controlla i campi.' };
    }
    return { success: false, error: 'Errore durante il salvataggio del prodotto.' };
  }
}
