'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const fornitoreSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  telefono: z.string().optional(),
  indirizzo: z.string().optional(),
  note: z.string().optional(),
});

export async function salvaFornitore(data: z.infer<typeof fornitoreSchema>) {
  try {
    const validatedData = fornitoreSchema.parse(data);

    if (validatedData.id) {
      // Update
      await prisma.fornitore.update({
        where: { id: validatedData.id },
        data: {
          nome: validatedData.nome,
          email: validatedData.email || null,
          telefono: validatedData.telefono,
          indirizzo: validatedData.indirizzo,
          note: validatedData.note,
        },
      });
    } else {
      // Create
      await prisma.fornitore.create({
        data: {
          nome: validatedData.nome,
          email: validatedData.email || null,
          telefono: validatedData.telefono,
          indirizzo: validatedData.indirizzo,
          note: validatedData.note,
        },
      });
    }

    revalidatePath('/fornitori');
    return { success: true };
  } catch (error) {
    console.error('Error saving fornitore:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dati non validi. Controlla i campi.' };
    }
    return { success: false, error: 'Errore durante il salvataggio del fornitore.' };
  }
}
