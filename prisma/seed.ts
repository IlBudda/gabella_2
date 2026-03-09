import { PrismaClient, Ruolo, TipoMovimento } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Inizio seeding...');

  // 1. Pulisci il database
  await prisma.movimentoMagazzino.deleteMany();
  await prisma.rigaVendita.deleteMany();
  await prisma.vendita.deleteMany();
  await prisma.bOMVariante.deleteMany();
  await prisma.bOM.deleteMany();
  await prisma.prodottoFornitore.deleteMany();
  await prisma.parteFornitore.deleteMany();
  await prisma.variante.deleteMany();
  await prisma.prodotto.deleteMany();
  await prisma.parte.deleteMany();
  await prisma.fornitore.deleteMany();
  await prisma.user.deleteMany();

  // 2. Crea Utenti
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      nome: 'Mario',
      cognome: 'Rossi',
      ruolo: Ruolo.ADMIN,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      passwordHash,
      nome: 'Luigi',
      cognome: 'Verdi',
      ruolo: Ruolo.MANAGER,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      passwordHash,
      nome: 'Anna',
      cognome: 'Bianchi',
      ruolo: Ruolo.VIEWER,
    },
  });

  // 3. Crea Fornitori
  const fornitore1 = await prisma.fornitore.create({
    data: {
      nome: 'Forniture Industriali S.p.A.',
      email: 'info@fornitureindustriali.it',
      telefono: '0212345678',
      indirizzo: 'Via Roma 1, Milano',
    },
  });

  const fornitore2 = await prisma.fornitore.create({
    data: {
      nome: 'Legno & Metallo S.r.l.',
      email: 'ordini@legnometallo.it',
      telefono: '0698765432',
      indirizzo: 'Via Napoli 10, Roma',
    },
  });

  // 4. Crea Parti
  const parti = await Promise.all([
    prisma.parte.create({
      data: { codice: 'P001', nome: 'Vite M6', unitaMisura: 'pz', quantitaDisponibile: 500, quantitaMinima: 100, costoUnitario: 0.05 },
    }),
    prisma.parte.create({
      data: { codice: 'P002', nome: 'Pannello Legno 1x1m', unitaMisura: 'pz', quantitaDisponibile: 10, quantitaMinima: 20, costoUnitario: 15.0 }, // Sotto soglia
    }),
    prisma.parte.create({
      data: { codice: 'P003', nome: 'Gamba Tavolo Metallo', unitaMisura: 'pz', quantitaDisponibile: 40, quantitaMinima: 50, costoUnitario: 8.5 }, // Sotto soglia
    }),
    prisma.parte.create({
      data: { codice: 'P004', nome: 'Vernice Trasparente', unitaMisura: 'L', quantitaDisponibile: 25, quantitaMinima: 10, costoUnitario: 12.0 },
    }),
    prisma.parte.create({
      data: { codice: 'P005', nome: 'Stoffa Blu', unitaMisura: 'm', quantitaDisponibile: 100, quantitaMinima: 50, costoUnitario: 5.0 },
    }),
    prisma.parte.create({
      data: { codice: 'P006', nome: 'Stoffa Rossa', unitaMisura: 'm', quantitaDisponibile: 55, quantitaMinima: 50, costoUnitario: 5.5 }, // Attenzione
    }),
  ]);

  // Associa parti ai fornitori
  await prisma.parteFornitore.createMany({
    data: [
      { parteId: parti[0].id, fornitoreId: fornitore1.id, prezzoAcquisto: 0.04, tempoConsegnaGiorni: 3 },
      { parteId: parti[1].id, fornitoreId: fornitore2.id, prezzoAcquisto: 14.0, tempoConsegnaGiorni: 7 },
      { parteId: parti[2].id, fornitoreId: fornitore1.id, prezzoAcquisto: 8.0, tempoConsegnaGiorni: 5 },
    ],
  });

  // 5. Crea Prodotti
  const prodotto1 = await prisma.prodotto.create({
    data: {
      codice: 'PROD-001',
      nome: 'Tavolo Oak Base',
      categoria: 'Mobili',
      prezzoVendita: 150.0,
      quantitaDisponibile: 5,
      quantitaMinima: 10, // Sotto soglia
      bom: {
        create: [
          { parteId: parti[1].id, quantitaRichiesta: 2 }, // 2 pannelli
          { parteId: parti[2].id, quantitaRichiesta: 4 }, // 4 gambe
          { parteId: parti[0].id, quantitaRichiesta: 16 }, // 16 viti
          { parteId: parti[3].id, quantitaRichiesta: 0.5 }, // 0.5L vernice
        ],
      },
    },
  });

  const prodotto2 = await prisma.prodotto.create({
    data: {
      codice: 'PROD-002',
      nome: 'Sedia Imbottita',
      categoria: 'Mobili',
      prezzoVendita: 80.0,
      quantitaDisponibile: 20,
      quantitaMinima: 15,
      bom: {
        create: [
          { parteId: parti[1].id, quantitaRichiesta: 0.5 },
          { parteId: parti[2].id, quantitaRichiesta: 4 },
          { parteId: parti[0].id, quantitaRichiesta: 8 },
        ],
      },
      varianti: {
        create: [
          {
            nome: 'Sedia Blu',
            sku: 'PROD-002-BLU',
            quantitaDisponibile: 12,
            quantitaMinima: 5,
            bom: {
              create: [{ parteId: parti[4].id, quantitaRichiesta: 1.5 }], // 1.5m stoffa blu
            },
          },
          {
            nome: 'Sedia Rossa',
            sku: 'PROD-002-ROS',
            quantitaDisponibile: 8,
            quantitaMinima: 10, // Sotto soglia
            prezzoOverride: 85.0,
            bom: {
              create: [{ parteId: parti[5].id, quantitaRichiesta: 1.5 }], // 1.5m stoffa rossa
            },
          },
        ],
      },
    },
  });

  const prodotto3 = await prisma.prodotto.create({
    data: {
      codice: 'PROD-003',
      nome: 'Scaffale Semplice',
      categoria: 'Mobili',
      prezzoVendita: 45.0,
      quantitaDisponibile: 30,
      quantitaMinima: 10,
      bom: {
        create: [
          { parteId: parti[1].id, quantitaRichiesta: 3 },
          { parteId: parti[0].id, quantitaRichiesta: 24 },
        ],
      },
    },
  });

  // 6. Crea Vendite
  const variantiSedia = await prisma.variante.findMany({ where: { prodottoId: prodotto2.id } });

  for (let i = 1; i <= 5; i++) {
    const vendita = await prisma.vendita.create({
      data: {
        numeroOrdine: `VEN-2026-${i.toString().padStart(4, '0')}`,
        data: new Date(Date.now() - i * 86400000), // Giorni precedenti
        clienteNome: `Cliente ${i}`,
        clienteEmail: `cliente${i}@example.com`,
        totale: 0, // Calcolato dopo
        creataDaId: admin.id,
      },
    });

    let totale = 0;

    // Aggiungi righe
    if (i % 2 === 0) {
      const q = 2;
      const p = prodotto1.prezzoVendita;
      await prisma.rigaVendita.create({
        data: {
          venditaId: vendita.id,
          prodottoId: prodotto1.id,
          quantita: q,
          prezzoUnitario: p,
          subtotale: q * p,
        },
      });
      totale += q * p;
    } else {
      const q = 4;
      const varBlu = variantiSedia.find((v) => v.sku === 'PROD-002-BLU')!;
      const p = varBlu.prezzoOverride || prodotto2.prezzoVendita;
      await prisma.rigaVendita.create({
        data: {
          venditaId: vendita.id,
          prodottoId: prodotto2.id,
          varianteId: varBlu.id,
          quantita: q,
          prezzoUnitario: p,
          subtotale: q * p,
        },
      });
      totale += q * p;
    }

    await prisma.vendita.update({
      where: { id: vendita.id },
      data: { totale },
    });
  }

  console.log('Seeding completato!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
