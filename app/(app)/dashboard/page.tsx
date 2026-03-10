import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StockBadge } from '@/components/ui/StockBadge';
import { Package, Boxes, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DashboardChart } from './DashboardChart';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const now = new Date();
  
  // KPI Data
  const [prodottiCount, partiCount, venditeOggi, venditeMese] = await Promise.all([
    prisma.prodotto.count(),
    prisma.parte.count(),
    prisma.vendita.aggregate({
      where: {
        data: { gte: startOfDay(now), lte: endOfDay(now) },
        annullata: false
      },
      _count: { id: true },
      _sum: { totale: true }
    }),
    prisma.vendita.aggregate({
      where: {
        data: { gte: startOfMonth(now), lte: endOfMonth(now) },
        annullata: false
      },
      _count: { id: true },
      _sum: { totale: true }
    })
  ]);

  // Alerts
  const tuttiProdotti = await prisma.prodotto.findMany({
    select: { id: true, codice: true, nome: true, quantitaDisponibile: true, quantitaMinima: true },
  });
  const prodottiAlert = tuttiProdotti.filter(p => p.quantitaDisponibile <= p.quantitaMinima * 1.2);

  const tutteVarianti = await prisma.variante.findMany({
    include: { prodotto: { select: { codice: true, nome: true } } },
  });
  const variantiAlert = tutteVarianti.filter(v => v.quantitaDisponibile <= v.quantitaMinima * 1.2);

  const tutteParti = await prisma.parte.findMany({
    select: { id: true, codice: true, nome: true, quantitaDisponibile: true, quantitaMinima: true },
  });
  const partiAlert = tutteParti.filter(p => p.quantitaDisponibile <= p.quantitaMinima * 1.2);

  const allAlerts = [
    ...prodottiAlert.map(p => ({ ...p, tipo: 'PRODOTTO' })),
    ...variantiAlert.map(v => ({ 
      id: v.id, 
      codice: v.sku, 
      nome: `${v.prodotto.nome} - ${v.nome}`, 
      quantitaDisponibile: v.quantitaDisponibile, 
      quantitaMinima: v.quantitaMinima, 
      tipo: 'VARIANTE' 
    })),
    ...partiAlert.map(p => ({ ...p, tipo: 'PARTE' })),
  ].sort((a, b) => (a.quantitaDisponibile / a.quantitaMinima) - (b.quantitaDisponibile / b.quantitaMinima));

  const criticalAlertsCount = allAlerts.filter(a => a.quantitaDisponibile <= a.quantitaMinima).length;

  // Ultime Vendite
  const ultimeVendite = await prisma.vendita.findMany({
    take: 10,
    orderBy: { data: 'desc' },
  });

  // Dati per grafico (ultimi 30 giorni)
  const thirtyDaysAgo = subDays(now, 30);
  const vendite30Giorni = await prisma.vendita.findMany({
    where: {
      data: { gte: startOfDay(thirtyDaysAgo) },
      annullata: false
    },
    select: { data: true, totale: true }
  });

  // Raggruppa vendite per giorno
  const chartDataMap = new Map();
  for (let i = 0; i < 30; i++) {
    const d = subDays(now, 29 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    chartDataMap.set(dateStr, {
      date: format(d, 'dd MMM', { locale: it }),
      totale: 0
    });
  }

  vendite30Giorni.forEach(v => {
    const dateStr = format(v.data, 'yyyy-MM-dd');
    if (chartDataMap.has(dateStr)) {
      const current = chartDataMap.get(dateStr);
      chartDataMap.set(dateStr, { ...current, totale: current.totale + v.totale });
    }
  });

  const chartData = Array.from(chartDataMap.values());

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        description="Panoramica del magazzino e delle vendite."
      />

      {/* Sezione A - KPI Strip */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Prodotti a magazzino"
          value={prodottiCount}
          icon={Package}
        />
        <StatCard 
          title="Parti a magazzino"
          value={partiCount}
          icon={Boxes}
        />
        <StatCard 
          title="Vendite oggi"
          value={formatCurrency(venditeOggi._sum.totale || 0)}
          subtitle={`${venditeOggi._count.id} ordini`}
          icon={ShoppingCart}
        />
        <StatCard 
          title="Vendite questo mese"
          value={formatCurrency(venditeMese._sum.totale || 0)}
          subtitle={`${venditeMese._count.id} ordini`}
          icon={TrendingUp}
        />
      </div>

      {/* Sezione B - Alert Magazzino */}
      <div>
        {allAlerts.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center text-emerald-800">
            <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-600" />
            <span className="font-medium">Magazzino nella norma. Nessun elemento in esaurimento.</span>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className={`p-4 border-b flex items-center justify-between ${criticalAlertsCount > 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center">
                <AlertTriangle className={`w-5 h-5 mr-3 ${criticalAlertsCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                <h3 className={`font-semibold ${criticalAlertsCount > 0 ? 'text-red-900' : 'text-amber-900'}`}>
                  Alert Magazzino
                </h3>
              </div>
              <Badge variant={criticalAlertsCount > 0 ? 'destructive' : 'secondary'} className="font-bold">
                {allAlerts.length} elementi da controllare
              </Badge>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-border sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">Tipo</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Codice</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Nome</th>
                    <th className="px-4 py-3 font-medium text-text-secondary text-right">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allAlerts.map((alert) => (
                    <tr key={`${alert.tipo}-${alert.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-text-secondary bg-gray-100 px-2 py-1 rounded">
                          {alert.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{alert.codice}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{alert.nome}</td>
                      <td className="px-4 py-3 text-right">
                        <StockBadge disponibile={alert.quantitaDisponibile} minima={alert.quantitaMinima} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sezione C - Grafico e Ultime Vendite */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Andamento Vendite (30 gg)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Ultime 10 Vendite</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-y border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">Ordine</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Cliente</th>
                    <th className="px-4 py-3 font-medium text-text-secondary text-right">Totale</th>
                    <th className="px-4 py-3 font-medium text-text-secondary text-center">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ultimeVendite.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/vendite/${v.id}`}>{v.numeroOrdine}</Link>
                      </td>
                      <td className="px-4 py-3 text-text-primary">{v.clienteNome || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(v.totale)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={v.annullata ? 'destructive' : 'success'}>
                          {v.annullata ? 'Annullata' : 'Completata'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {ultimeVendite.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                        Nessuna vendita registrata.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
