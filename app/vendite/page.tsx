import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export default async function VenditePage({
  searchParams,
}: {
  searchParams: { q?: string; stato?: string };
}) {
  const q = searchParams.q || '';
  const stato = searchParams.stato || '';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Vendite</h1>
          <p className="text-muted-foreground">Visualizza e registra le vendite.</p>
        </div>
        <Button asChild>
          <Link href="/vendite/nuova">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Vendita
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
                placeholder="Cerca per n° ordine o cliente..."
                className="pl-8"
                defaultValue={q}
              />
            </div>
            <select
              name="stato"
              className="flex h-10 w-full sm:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={stato}
            >
              <option value="">Tutti gli stati</option>
              <option value="attive">Attive</option>
              <option value="annullate">Annullate</option>
            </select>
            <Button type="submit" variant="secondary">Filtra</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">N° Ordine</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Righe</th>
                  <th className="px-4 py-3">Totale</th>
                  <th className="px-4 py-3">Creato da</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {vendite.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary">
                      <Link href={`/vendite/${v.id}`}>{v.numeroOrdine}</Link>
                    </td>
                    <td className="px-4 py-3">{v.data.toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-3">{v.clienteNome || '-'}</td>
                    <td className="px-4 py-3">{v._count.righe}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(v.totale)}</td>
                    <td className="px-4 py-3">{v.creatore.nome} {v.creatore.cognome}</td>
                    <td className="px-4 py-3">
                      {v.annullata ? (
                        <Badge variant="destructive">Annullata</Badge>
                      ) : (
                        <Badge variant="success">Completata</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/vendite/${v.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vendite.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna vendita trovata.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
