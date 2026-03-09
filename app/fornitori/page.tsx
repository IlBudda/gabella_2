import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Fornitori</h1>
          <p className="text-muted-foreground">Visualizza e gestisci i fornitori di parti e prodotti.</p>
        </div>
        <Button asChild>
          <Link href="/fornitori/nuovo">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Fornitore
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                type="search"
                placeholder="Cerca per nome o email..."
                className="pl-8"
                defaultValue={q}
              />
            </div>
            <Button type="submit" variant="secondary">Cerca</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Prodotti Forniti</th>
                  <th className="px-4 py-3">Parti Fornite</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {fornitori.map((f) => (
                  <tr key={f.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{f.nome}</td>
                    <td className="px-4 py-3">{f.email || '-'}</td>
                    <td className="px-4 py-3">{f.telefono || '-'}</td>
                    <td className="px-4 py-3">{f._count.prodotti}</td>
                    <td className="px-4 py-3">{f._count.parti}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/fornitori/${f.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/fornitori/${f.id}/modifica`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fornitori.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nessun fornitore trovato.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
