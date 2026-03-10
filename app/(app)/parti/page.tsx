import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StockBadge } from '@/components/ui/StockBadge';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function PartiPage({
  searchParams,
}: {
  searchParams: { q?: string; stato?: string };
}) {
  const q = searchParams.q || '';
  const stato = searchParams.stato || 'tutti';

  const parti = await prisma.parte.findMany({
    where: {
      OR: [
        { codice: { contains: q, mode: 'insensitive' } },
        { nome: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { fornitori: true, movimenti: true } }
    }
  });

  const filteredParti = parti.filter(p => {
    if (stato === 'tutti' || stato === '') return true;
    const ratio = p.quantitaDisponibile / p.quantitaMinima;
    if (stato === 'critico') return ratio <= 1;
    if (stato === 'attenzione') return ratio > 1 && ratio <= 1.2;
    if (stato === 'regolare') return ratio > 1.2;
    return true;
  });

  const columns = [
    {
      header: 'Codice',
      accessor: (row: any) => <span className="font-mono text-xs">{row.codice}</span>,
    },
    {
      header: 'Nome',
      accessor: (row: any) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: 'Stato',
      accessor: (row: any) => (
        <Badge variant={row.attivo ? 'success' : 'secondary'}>
          {row.attivo ? 'Attivo' : 'Inattivo'}
        </Badge>
      ),
    },
    {
      header: 'Giacenza',
      accessor: (row: any) => <StockBadge disponibile={row.quantitaDisponibile} minima={row.quantitaMinima} />,
    },
    {
      header: 'Costo Unitario',
      accessor: (row: any) => row.costoUnitario ? formatCurrency(row.costoUnitario) : '-',
    },
    {
      header: 'Fornitori',
      accessor: (row: any) => row._count.fornitori,
      className: 'text-center'
    },
    {
      header: '',
      accessor: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-text-secondary hover:text-primary">
            <Link href={`/parti/${row.id}`} title="Visualizza">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-text-secondary hover:text-primary">
            <Link href={`/parti/${row.id}/modifica`} title="Modifica">
              <Edit className="h-4 w-4" />
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
        title="Parti e Componenti" 
        description="Gestisci l'anagrafica delle parti e dei componenti di magazzino."
        action={
          <Button asChild className="bg-primary hover:bg-primary/90 text-white">
            <Link href="/parti/nuova">
              <Plus className="mr-2 h-4 w-4" />
              Nuova Parte
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
              placeholder="Cerca per codice o nome..." 
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
              <option value="critico">Critico</option>
              <option value="attenzione">Attenzione</option>
              <option value="regolare">Regolare</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" className="sm:hidden">
            Filtra
          </Button>
        </form>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredParti} 
        emptyMessage="Nessuna parte trovata con i filtri attuali."
      />
    </div>
  );
}
