import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Download, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportPage() {
  const vendite = await prisma.vendita.findMany({
    where: { annullata: false },
    orderBy: { data: 'desc' },
    include: {
      righe: {
        include: { prodotto: true, variante: true }
      }
    }
  });

  const totaleVendite = vendite.reduce((acc, v) => acc + v.totale, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report</h1>
          <p className="text-muted-foreground">Visualizza e scarica i report del magazzino.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Esporta Excel
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Esporta PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Vendite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-2xl font-bold">
            Totale: {formatCurrency(totaleVendite)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">N° Ordine</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Prodotti</th>
                  <th className="px-4 py-3 text-right">Totale</th>
                </tr>
              </thead>
              <tbody>
                {vendite.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{v.numeroOrdine}</td>
                    <td className="px-4 py-3">{v.data.toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-3">{v.clienteNome || '-'}</td>
                    <td className="px-4 py-3">
                      {v.righe.map(r => r.variante ? `${r.prodotto.nome} (${r.variante.nome})` : r.prodotto.nome).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(v.totale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
