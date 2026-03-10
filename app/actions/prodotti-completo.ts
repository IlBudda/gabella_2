'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPartiForBOM() {
  return await prisma.parte.findMany({
    where: { attivo: true },
    select: { id: true, codice: true, nome: true, quantitaDisponibile: true, unitaMisura: true },
    orderBy: { nome: 'asc' }
  });
}

export async function getFornitoriForProdotto() {
  return await prisma.fornitore.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' }
  });
}

export async function salvaProdottoCompleto(data: any) {
  try {
    const { base, bom, varianti, fornitori } = data;

    // Check for duplicate code
    const existingProdotto = await prisma.prodotto.findUnique({
      where: { codice: base.codice },
    });

    if (existingProdotto && existingProdotto.id !== base.id) {
      return { success: false, error: 'Un prodotto con questo codice esiste già.' };
    }

    await prisma.$transaction(async (tx) => {
      let prodottoId = base.id;

      if (prodottoId) {
        // Update base info
        await tx.prodotto.update({
          where: { id: prodottoId },
          data: {
            codice: base.codice,
            nome: base.nome,
            descrizione: base.descrizione,
            categoria: base.categoria,
            unitaMisura: base.unitaMisura,
            quantitaMinima: base.quantitaMinima,
            prezzoVendita: base.prezzoVendita,
            note: base.note,
            attivo: base.attivo,
          },
        });

        // Update BOM
        await tx.bOM.deleteMany({ where: { prodottoId } });
        if (bom && bom.length > 0) {
          await tx.bOM.createMany({
            data: bom.map((item: any) => ({
              prodottoId,
              parteId: item.parteId,
              quantitaRichiesta: item.quantitaRichiesta,
            }))
          });
        }

        // Update Varianti (simplified: delete and recreate for now, or just update if ID exists)
        // For a robust implementation, we should upsert.
        const existingVarianti = await tx.variante.findMany({ where: { prodottoId } });
        const existingVariantiIds = existingVarianti.map(v => v.id);
        const newVariantiIds = varianti.filter((v: any) => v.id).map((v: any) => v.id);
        
        // Delete removed varianti
        const variantiToDelete = existingVariantiIds.filter(id => !newVariantiIds.includes(id));
        if (variantiToDelete.length > 0) {
          await tx.variante.deleteMany({ where: { id: { in: variantiToDelete } } });
        }

        // Upsert varianti
        for (const v of varianti) {
          if (v.id) {
            await tx.variante.update({
              where: { id: v.id },
              data: {
                nome: v.nome,
                sku: v.sku,
                quantitaMinima: v.quantitaMinima,
                prezzoOverride: v.prezzoOverride,
              }
            });
          } else {
            await tx.variante.create({
              data: {
                prodottoId,
                nome: v.nome,
                sku: v.sku,
                quantitaMinima: v.quantitaMinima,
                prezzoOverride: v.prezzoOverride,
                quantitaDisponibile: 0,
              }
            });
          }
        }

        // Update Fornitori
        await tx.prodottoFornitore.deleteMany({ where: { prodottoId } });
        if (fornitori && fornitori.length > 0) {
          await tx.prodottoFornitore.createMany({
            data: fornitori.map((f: any) => ({
              prodottoId,
              fornitoreId: f.fornitoreId,
              prezzoAcquisto: f.prezzoAcquisto,
              fornitorePreferito: f.fornitorePreferito,
            }))
          });
        }

      } else {
        // Create new
        const newProdotto = await tx.prodotto.create({
          data: {
            codice: base.codice,
            nome: base.nome,
            descrizione: base.descrizione,
            categoria: base.categoria,
            unitaMisura: base.unitaMisura,
            quantitaMinima: base.quantitaMinima,
            prezzoVendita: base.prezzoVendita,
            note: base.note,
            attivo: base.attivo,
            quantitaDisponibile: 0,
          },
        });
        prodottoId = newProdotto.id;

        // Create BOM
        if (bom && bom.length > 0) {
          await tx.bOM.createMany({
            data: bom.map((item: any) => ({
              prodottoId,
              parteId: item.parteId,
              quantitaRichiesta: item.quantitaRichiesta,
            }))
          });
        }

        // Create Varianti
        if (varianti && varianti.length > 0) {
          await tx.variante.createMany({
            data: varianti.map((v: any) => ({
              prodottoId,
              nome: v.nome,
              sku: v.sku,
              quantitaMinima: v.quantitaMinima,
              prezzoOverride: v.prezzoOverride,
              quantitaDisponibile: 0,
            }))
          });
        }

        // Create Fornitori
        if (fornitori && fornitori.length > 0) {
          await tx.prodottoFornitore.createMany({
            data: fornitori.map((f: any) => ({
              prodottoId,
              fornitoreId: f.fornitoreId,
              prezzoAcquisto: f.prezzoAcquisto,
              fornitorePreferito: f.fornitorePreferito,
            }))
          });
        }
      }
    });

    revalidatePath('/prodotti');
    return { success: true };
  } catch (error) {
    console.error('Error saving prodotto completo:', error);
    return { success: false, error: 'Errore durante il salvataggio del prodotto.' };
  }
}
