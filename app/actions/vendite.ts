'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getProdottiForVendita() {
  return await prisma.prodotto.findMany({
    where: { attivo: true },
    include: {
      varianti: {
        where: { attivo: true }
      }
    },
    orderBy: { nome: 'asc' }
  });
}

export async function verificaDisponibilita(righe: any[]) {
  const risultati = [];
  let tuttoDisponibile = true;

  for (const riga of righe) {
    if (!riga.prodottoId) continue;

    const prodotto = await prisma.prodotto.findUnique({
      where: { id: riga.prodottoId },
      include: { varianti: true }
    });

    if (!prodotto) continue;

    if (riga.varianteId) {
      const variante = prodotto.varianti.find(v => v.id === riga.varianteId);
      if (variante) {
        const disponibile = variante.quantitaDisponibile;
        const sufficiente = disponibile >= riga.quantita;
        if (!sufficiente) tuttoDisponibile = false;
        
        risultati.push({
          elemento: `${prodotto.nome} - ${variante.nome}`,
          tipo: 'Variante',
          disponibile,
          necessario: riga.quantita,
          sufficiente
        });
      }
    } else {
      const disponibile = prodotto.quantitaDisponibile;
      const sufficiente = disponibile >= riga.quantita;
      if (!sufficiente) tuttoDisponibile = false;

      risultati.push({
        elemento: prodotto.nome,
        tipo: 'Prodotto',
        disponibile,
        necessario: riga.quantita,
        sufficiente
      });
    }
  }

  return { tuttoDisponibile, risultati };
}

export async function annullaVendita(venditaId: string, motivazione: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato' };
  }

  try {
    const vendita = await prisma.vendita.findUnique({
      where: { id: venditaId },
      include: { righe: true }
    });

    if (!vendita) {
      return { success: false, error: 'Vendita non trovata' };
    }

    if (vendita.annullata) {
      return { success: false, error: 'Vendita già annullata' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Segna la vendita come annullata
      await tx.vendita.update({
        where: { id: venditaId },
        data: {
          annullata: true,
          motivazioneAnnullamento: motivazione
        }
      });

      // 2. Ripristina lo stock e crea movimenti di annullamento
      for (const riga of vendita.righe) {
        if (riga.varianteId) {
          const variante = await tx.variante.findUnique({ where: { id: riga.varianteId } });
          if (variante) {
            await tx.variante.update({
              where: { id: riga.varianteId },
              data: { quantitaDisponibile: { increment: riga.quantita } }
            });
            await tx.movimentoMagazzino.create({
              data: {
                tipo: 'ANNULLAMENTO',
                varianteId: riga.varianteId,
                prodottoId: riga.prodottoId,
                quantita: riga.quantita,
                quantitaPrecedente: variante.quantitaDisponibile,
                quantitaSuccessiva: variante.quantitaDisponibile + riga.quantita,
                venditaId: vendita.id,
                creatoDaId: session.user.id,
                note: `Annullamento vendita ${vendita.numeroOrdine}: ${motivazione}`
              }
            });
          }
        } else {
          const prodotto = await tx.prodotto.findUnique({ where: { id: riga.prodottoId } });
          if (prodotto) {
            await tx.prodotto.update({
              where: { id: riga.prodottoId },
              data: { quantitaDisponibile: { increment: riga.quantita } }
            });
            await tx.movimentoMagazzino.create({
              data: {
                tipo: 'ANNULLAMENTO',
                prodottoId: riga.prodottoId,
                quantita: riga.quantita,
                quantitaPrecedente: prodotto.quantitaDisponibile,
                quantitaSuccessiva: prodotto.quantitaDisponibile + riga.quantita,
                venditaId: vendita.id,
                creatoDaId: session.user.id,
                note: `Annullamento vendita ${vendita.numeroOrdine}: ${motivazione}`
              }
            });
          }
        }
      }
    });

    revalidatePath('/vendite');
    revalidatePath(`/vendite/${venditaId}`);
    revalidatePath('/dashboard');
    revalidatePath('/prodotti');
    return { success: true };
  } catch (error) {
    console.error('Error annullando vendita:', error);
    return { success: false, error: 'Errore durante l\'annullamento della vendita.' };
  }
}

export async function salvaVendita(data: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorizzato' };
  }

  try {
    // 1. Verifica disponibilità di nuovo per sicurezza
    const { tuttoDisponibile } = await verificaDisponibilita(data.righe);
    if (!tuttoDisponibile) {
      return { success: false, error: 'Disponibilità insufficiente per uno o più prodotti.' };
    }

    // 2. Genera numero ordine (es. ORD-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.vendita.count({
      where: {
        numeroOrdine: { startsWith: `ORD-${dateStr}` }
      }
    });
    const numeroOrdine = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // 3. Calcola totale
    const totale = data.righe.reduce((acc: number, riga: any) => acc + (riga.quantita * riga.prezzoUnitario), 0);

    // 4. Transazione per creare vendita e aggiornare stock
    await prisma.$transaction(async (tx) => {
      const vendita = await tx.vendita.create({
        data: {
          numeroOrdine,
          data: new Date(data.data),
          clienteNome: data.clienteNome || null,
          clienteEmail: data.clienteEmail || null,
          note: data.note || null,
          totale,
          creataDaId: session.user.id,
          righe: {
            create: data.righe.map((riga: any) => ({
              prodottoId: riga.prodottoId,
              varianteId: riga.varianteId || null,
              quantita: riga.quantita,
              prezzoUnitario: riga.prezzoUnitario,
              subtotale: riga.quantita * riga.prezzoUnitario
            }))
          }
        }
      });

      // Aggiorna stock e crea movimenti
      for (const riga of data.righe) {
        if (riga.varianteId) {
          const variante = await tx.variante.findUnique({ where: { id: riga.varianteId } });
          if (variante) {
            await tx.variante.update({
              where: { id: riga.varianteId },
              data: { quantitaDisponibile: { decrement: riga.quantita } }
            });
            await tx.movimentoMagazzino.create({
              data: {
                tipo: 'VENDITA',
                varianteId: riga.varianteId,
                prodottoId: riga.prodottoId,
                quantita: -riga.quantita,
                quantitaPrecedente: variante.quantitaDisponibile,
                quantitaSuccessiva: variante.quantitaDisponibile - riga.quantita,
                venditaId: vendita.id,
                creatoDaId: session.user.id,
                note: `Vendita ${numeroOrdine}`
              }
            });
          }
        } else {
          const prodotto = await tx.prodotto.findUnique({ where: { id: riga.prodottoId } });
          if (prodotto) {
            await tx.prodotto.update({
              where: { id: riga.prodottoId },
              data: { quantitaDisponibile: { decrement: riga.quantita } }
            });
            await tx.movimentoMagazzino.create({
              data: {
                tipo: 'VENDITA',
                prodottoId: riga.prodottoId,
                quantita: -riga.quantita,
                quantitaPrecedente: prodotto.quantitaDisponibile,
                quantitaSuccessiva: prodotto.quantitaDisponibile - riga.quantita,
                venditaId: vendita.id,
                creatoDaId: session.user.id,
                note: `Vendita ${numeroOrdine}`
              }
            });
          }
        }
      }
    });

    revalidatePath('/vendite');
    revalidatePath('/dashboard');
    revalidatePath('/prodotti');
    return { success: true };
  } catch (error) {
    console.error('Error saving vendita:', error);
    return { success: false, error: 'Errore durante il salvataggio della vendita.' };
  }
}
