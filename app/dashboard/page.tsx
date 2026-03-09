import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Package, Boxes, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const now = new Date();
  
  // KPI Data
  const [prodottiCount, partiCount] = await Promise.all([
    prisma.prodotto.count(),
    prisma.parte.count(),
  ]);

  const venditeOggi = await prisma.vendita.aggregate({
    where: {
      data: {
        gte: startOfDay(now),
        lte: endOfDay(now),
      },
      annullata: false,
    },
    _count: { id: true },
    _sum: { totale: true },
  });

  const venditeMese = await prisma.vendita.aggregate({
    where: {
      data: {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      },
      annullata: false,
    },
    _count: { id: true },
    _sum: { totale: true },
  });

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

  // Ultime Vendite
  const ultimeVendite = await prisma.vendita.findMany({
    take: 10,
    orderBy: { data: 'desc' },
    include: { creatore: { select: { nome: true, cognome: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Panoramica del magazzino e delle vendite.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prodotti a Magazzino</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(prodottiCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parti a Magazzino</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(partiCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendite Oggi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(venditeOggi._sum.totale || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {venditeOggi._count.id} ordini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendite Mese</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(venditeMese._sum.totale || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {venditeMese._count.id} ordini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-red-100 shadow-sm">
        <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800">Alert Magazzino</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {allAlerts.length === 0 ? (
            <div className="p-6 text-center text-green-600 font-medium flex items-center justify-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              Magazzino nella norma
            </div>
          ) : (
            <div className="divide-y">
              {allAlerts.map((alert) => {
                const isCritical = alert.quantitaDisponibile <= alert.quantitaMinima;
                return (
                  <div key={`${alert.tipo}-${alert.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div>
                      <div className="font-medium flex items-center">
                        <span className="text-xs text-gray-500 mr-2 w-16">{alert.tipo}</span>
                        {alert.codice} - {alert.nome}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Disponibile: <span className="font-bold text-gray-900">{alert.quantitaDisponibile}</span> / Minima: {alert.quantitaMinima}
                      </div>
                    </div>
                    <Badge variant={isCritical ? "critical" : "warning"}>
                      {isCritical ? "⚠ Critico" : "Attenzione"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ultime Vendite */}
      <Card>
        <CardHeader>
          <CardTitle>Ultime Vendite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Ordine</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Totale</th>
                  <th className="px-4 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {ultimeVendite.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary">
                      <Link href={`/vendite/${v.id}`}>{v.numeroOrdine}</Link>
                    </td>
                    <td className="px-4 py-3">{v.data.toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-3">{v.clienteNome || '-'}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(v.totale)}</td>
                    <td className="px-4 py-3">
                      {v.annullata ? (
                        <Badge variant="destructive">Annullata</Badge>
                      ) : (
                        <Badge variant="success">Completata</Badge>
                      )}
                    </td>
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
