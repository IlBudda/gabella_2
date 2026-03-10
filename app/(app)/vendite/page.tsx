import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function VenditePage({
  searchParams,
}: {
  searchParams: { q?: string; stato?: string };
}) {
  const q = searchParams.q || '';
  const stato = searchParams.stato || 'tutti';

  const vendite = await prisma.vendita.findMany({
    where: {
      OR: [
        { numeroOrdine: { contains: q, mode: 'insensitive' } },
        { clienteNome: { contains: q, mode: 'insensitive' } },
      ],
      ...(stato === 'attive' ? { annullata: false } : {}),
      ...(stato === 'annullate' ? { annullata: true } : {}),
    },
    include: {
      _count: {
        select: { righe: true },
      },
      creatore: {
        select: { nome: true, cognome: true },
      },
    },
    orderBy: { data: 'desc' },
  });

  const columns = [
    {
      header: 'N° Ordine',
      accessor: (row: any) => (
        <Link href={`/vendite/${row.id}`} className="font-medium text-primary hover:underline">
          {row.numeroOrdine}
        </Link>
      ),
    },
    {
      header: 'Data',
      accessor: (row: any) => row.data.toLocaleDateString('it-IT'),
    },
    {
      header: 'Cliente',
      accessor: (row: any) => row.clienteNome || '-',
    },
    {
      header: 'Righe',
      accessor: (row: any) => row._count.righe,
      className: 'text-center'
    },
    {
      header: 'Totale',
      accessor: (row: any) => <span className="font-medium">{formatCurrency(row.totale)}</span>,
    },
    {
      header: 'Creato da',
      accessor: (row: any) => `${row.creatore.nome} ${row.creatore.cognome}`,
    },
    {
      header: 'Stato',
      accessor: (row: any) => (
        <Badge variant={row.annullata ? 'destructive' : 'success'}>
          {row.annullata ? 'Annullata' : 'Completata'}
        </Badge>
      ),
    },
    {
      header: '',
      accessor: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-text-secondary hover:text-primary">
            <Link href={`/vendite/${row.id}`} title="Visualizza">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendite" 
        description="Visualizza e registra le vendite."
        action={
          <Button asChild className="bg-primary hover:bg-primary/90 text-white">
            <Link href="/vendite/nuova">
              <Plus className="mr-2 h-4 w-4" />
              Nuova Vendita
            </Link>
          </Button>
        }
      />

      <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <form className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input 
              name="q" 
              defaultValue={q} 
              placeholder="Cerca per n° ordine o cliente..." 
              className="pl-9 bg-background border-border"
            />
          </div>
          <div className="sm:w-48">
            <select 
              name="stato" 
              defaultValue={stato}
              className="w-full h-10 px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onChange={(e) => e.target.form?.submit()}
            >
              <option value="tutti">Tutti gli stati</option>
              <option value="attive">Attive</option>
              <option value="annullate">Annullate</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" className="sm:hidden">
            Filtra
          </Button>
        </form>
      </div>

      <DataTable 
        columns={columns} 
        data={vendite} 
        emptyMessage="Nessuna vendita trovata con i filtri attuali."
      />
    </div>
  );
}
