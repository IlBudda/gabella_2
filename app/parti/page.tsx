import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export default async function PartiPage({
  searchParams,
}: {
  searchParams: { q?: string; stato?: string };
}) {
  const q = searchParams.q || '';
  const stato = searchParams.stato || '';

  const parti = await prisma.parte.findMany({
    where: {
      OR: [
        { codice: { contains: q, mode: 'insensitive' } },
        { nome: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { codice: 'asc' },
  });

  const filteredParti = parti.filter((p) => {
    if (stato === 'critico') return p.quantitaDisponibile <= p.quantitaMinima;
    if (stato === 'attenzione') return p.quantitaDisponibile > p.quantitaMinima && p.quantitaDisponibile <= p.quantitaMinima * 1.2;
    if (stato === 'regolare') return p.quantitaDisponibile > p.quantitaMinima * 1.2;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Parti</h1>
          <p className="text-muted-foreground">Visualizza e gestisci le parti di magazzino.</p>
        </div>
        <Button asChild>
          <Link href="/parti/nuova">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Parte
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
                placeholder="Cerca per codice o nome..."
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
              <option value="critico">Critico</option>
              <option value="attenzione">Attenzione</option>
              <option value="regolare">Regolare</option>
            </select>
            <Button type="submit" variant="secondary">Filtra</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Codice</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">U.M.</th>
                  <th className="px-4 py-3">Disponibile</th>
                  <th className="px-4 py-3">Soglia Min.</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredParti.map((p) => {
                  const isCritical = p.quantitaDisponibile <= p.quantitaMinima;
                  const isWarning = p.quantitaDisponibile > p.quantitaMinima && p.quantitaDisponibile <= p.quantitaMinima * 1.2;
                  
                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.codice}</td>
                      <td className="px-4 py-3">{p.nome}</td>
                      <td className="px-4 py-3">{p.unitaMisura}</td>
                      <td className="px-4 py-3 font-bold">{p.quantitaDisponibile}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.quantitaMinima}</td>
                      <td className="px-4 py-3">{p.costoUnitario ? formatCurrency(p.costoUnitario) : '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isCritical ? "critical" : isWarning ? "warning" : "success"}>
                          {isCritical ? "⚠ Critico" : isWarning ? "Attenzione" : "Regolare"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/parti/${p.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/parti/${p.id}/modifica`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredParti.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna parte trovata.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
