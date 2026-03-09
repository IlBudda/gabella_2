# MagazzinoApp - Gestionale di Magazzino

Un'applicazione web full-stack per la gestione del magazzino, sviluppata con Next.js 14, Prisma, PostgreSQL e Tailwind CSS.
Questo progetto è progettato per funzionare completamente in locale, senza dipendenze da servizi cloud esterni.

## Prerequisiti
- Node.js 18+
- PostgreSQL in esecuzione localmente

## Setup Locale

1. Installa PostgreSQL:
   ```bash
   brew install postgresql@16
   ```
2. Avvia PostgreSQL:
   ```bash
   brew services start postgresql@16
   ```
3. Crea il database:
   ```bash
   createdb magazzino_db
   ```
4. Installa dipendenze:
   ```bash
   npm install
   ```
5. Esegui migration:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Popola dati di test:
   ```bash
   npx prisma db seed
   ```
7. Avvia il server:
   ```bash
   npm run dev
   ```
8. Apri il browser su: http://localhost:3000

## Credenziali di Test
- **Admin**: admin@example.com / Password123!
- **Manager**: manager@example.com / Password123!
- **Viewer**: viewer@example.com / Password123!
