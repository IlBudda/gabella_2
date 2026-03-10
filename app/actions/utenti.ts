'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import bcrypt from 'bcryptjs';

const utenteSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  cognome: z.string().min(1, 'Il cognome è obbligatorio'),
  email: z.string().email('Email non valida'),
  ruolo: z.enum(['ADMIN', 'MANAGER', 'VIEWER']),
  password: z.string().optional(),
  attivo: z.boolean().default(true),
});

export async function salvaUtente(data: z.infer<typeof utenteSchema>) {
  try {
    const validatedData = utenteSchema.parse(data);

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser && existingUser.id !== validatedData.id) {
      return { success: false, error: 'Un utente con questa email esiste già.' };
    }

    if (validatedData.id) {
      // Update
      const updateData: any = {
        nome: validatedData.nome,
        cognome: validatedData.cognome,
        email: validatedData.email,
        ruolo: validatedData.ruolo,
        attivo: validatedData.attivo,
      };

      if (validatedData.password) {
        updateData.passwordHash = await bcrypt.hash(validatedData.password, 10);
      }

      await prisma.user.update({
        where: { id: validatedData.id },
        data: updateData,
      });
    } else {
      // Create
      if (!validatedData.password) {
        return { success: false, error: 'La password è obbligatoria per i nuovi utenti.' };
      }

      const passwordHash = await bcrypt.hash(validatedData.password, 10);

      await prisma.user.create({
        data: {
          nome: validatedData.nome,
          cognome: validatedData.cognome,
          email: validatedData.email,
          ruolo: validatedData.ruolo,
          attivo: validatedData.attivo,
          passwordHash,
        },
      });
    }

    revalidatePath('/utenti');
    return { success: true };
  } catch (error) {
    console.error('Error saving utente:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dati non validi. Controlla i campi.' };
    }
    return { success: false, error: 'Errore durante il salvataggio dell\'utente.' };
  }
}
