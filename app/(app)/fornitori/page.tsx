import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';

export const dynamic = 'force-dynamic';

export default async function FornitoriPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q || '';

  const fornitori = await prisma.fornitore.findMany({
    where: {
      OR: [
        { nome: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: {
      _count: {
        select: { prodotti: true, parti: true },
      },
    },
    orderBy: { nome: 'asc' },
  });

  const columns = [
    {
      header: 'Nome',
      accessor: (row: any) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: 'Email',
      accessor: (row: any) => row.email || '-',
    },
    {
      header: 'Telefono',
      accessor: (row: any) => row.telefono || '-',
    },
    {
      header: 'Prodotti Forniti',
      accessor: (row: any) => row._count.prodotti,
      className: 'text-center'
    },
    {
      header: 'Parti Fornite',
      accessor: (row: any) => row._count.parti,
      className: 'text-center'
    },
    {
      header: '',
      accessor: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-text-secondary hover:text-primary">
            <Link href={`/fornitori/${row.id}`} title="Visualizza">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-text-secondary hover:text-primary">
            <Link href={`/fornitori/${row.id}/modifica`} title="Modifica">
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
        title="Fornitori" 
        description="Gestisci i fornitori di parti e prodotti."
        action={
          <Button asChild className="bg-primary hover:bg-primary/90 text-white">
            <Link href="/fornitori/nuovo">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Fornitore
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
              placeholder="Cerca per nome o email..." 
              className="pl-9 bg-background border-border"
            />
          </div>
          <Button type="submit" variant="secondary" className="sm:hidden">
            Cerca
          </Button>
        </form>
      </div>

      <DataTable 
        columns={columns} 
        data={fornitori} 
        emptyMessage="Nessun fornitore trovato con i filtri attuali."
      />
    </div>
  );
}
