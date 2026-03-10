import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Download, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function ReportPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const currentTab = searchParams.tab || 'vendite';

  const tabs = [
    { id: 'vendite', label: 'Vendite' },
    { id: 'stock-prodotti', label: 'Stock Prodotti' },
    { id: 'stock-parti', label: 'Stock Parti' },
    { id: 'movimenti', label: 'Movimenti' },
  ];

  let content = null;

  if (currentTab === 'vendite') {
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

    const columns = [
      {
        header: 'N° Ordine',
        accessor: (row: any) => <span className="font-medium text-primary">{row.numeroOrdine}</span>,
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
        header: 'Prodotti',
        accessor: (row: any) => row.righe.map((r: any) => r.variante ? `${r.prodotto.nome} (${r.variante.nome})` : r.prodotto.nome).join(', '),
      },
      {
        header: 'Totale',
        accessor: (row: any) => <span className="font-medium">{formatCurrency(row.totale)}</span>,
        className: 'text-right'
      }
    ];

    content = (
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Riepilogo Vendite</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white">
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="bg-white">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10 inline-block">
            <p className="text-sm text-text-secondary font-medium mb-1">Totale Vendite</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totaleVendite)}</p>
          </div>
          
          <DataTable 
            columns={columns} 
            data={vendite} 
            emptyMessage="Nessuna vendita trovata."
          />
        </CardContent>
      </Card>
    );
  } else if (currentTab === 'stock-prodotti') {
    const prodotti = await prisma.prodotto.findMany({
      include: { varianti: true },
    });

    const data: any[] = [];
    prodotti.forEach(p => {
      if (p.varianti.length > 0) {
        p.varianti.forEach(v => {
          data.push({
            id: v.id,
            codice: v.sku,
            nome: `${p.nome} - ${v.nome}`,
            disponibile: v.quantitaDisponibile,
            minima: v.quantitaMinima,
            unitaMisura: p.unitaMisura,
          });
        });
      } else {
        data.push({
          id: p.id,
          codice: p.codice,
          nome: p.nome,
          disponibile: p.quantitaDisponibile,
          minima: p.quantitaMinima,
          unitaMisura: p.unitaMisura,
        });
      }
    });

    data.sort((a, b) => {
      const aRatio = a.disponibile / (a.minima || 1);
      const bRatio = b.disponibile / (b.minima || 1);
      return aRatio - bRatio;
    });

    const columns = [
      { header: 'Codice', accessor: (row: any) => <span className="font-medium">{row.codice}</span> },
      { header: 'Nome', accessor: (row: any) => row.nome },
      { header: 'Disponibile', accessor: (row: any) => `${row.disponibile} ${row.unitaMisura}` },
      { header: 'Minima', accessor: (row: any) => `${row.minima} ${row.unitaMisura}` },
      { 
        header: 'Stato', 
        accessor: (row: any) => {
          if (row.disponibile <= row.minima) return <Badge variant="destructive">Critico</Badge>;
          if (row.disponibile <= row.minima * 1.2) return <Badge variant="warning">Attenzione</Badge>;
          return <Badge variant="success">Regolare</Badge>;
        }
      },
    ];

    content = (
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Prodotti</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white">
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="bg-white">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} emptyMessage="Nessun prodotto trovato." />
        </CardContent>
      </Card>
    );
  } else if (currentTab === 'stock-parti') {
    const parti = await prisma.parte.findMany();

    const data = parti.map(p => ({
      id: p.id,
      codice: p.codice,
      nome: p.nome,
      disponibile: p.quantitaDisponibile,
      minima: p.quantitaMinima,
      unitaMisura: p.unitaMisura,
    })).sort((a, b) => {
      const aRatio = a.disponibile / (a.minima || 1);
      const bRatio = b.disponibile / (b.minima || 1);
      return aRatio - bRatio;
    });

    const columns = [
      { header: 'Codice', accessor: (row: any) => <span className="font-medium">{row.codice}</span> },
      { header: 'Nome', accessor: (row: any) => row.nome },
      { header: 'Disponibile', accessor: (row: any) => `${row.disponibile} ${row.unitaMisura}` },
      { header: 'Minima', accessor: (row: any) => `${row.minima} ${row.unitaMisura}` },
      { 
        header: 'Stato', 
        accessor: (row: any) => {
          if (row.disponibile <= row.minima) return <Badge variant="destructive">Critico</Badge>;
          if (row.disponibile <= row.minima * 1.2) return <Badge variant="warning">Attenzione</Badge>;
          return <Badge variant="success">Regolare</Badge>;
        }
      },
    ];

    content = (
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Parti</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white">
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="bg-white">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} emptyMessage="Nessuna parte trovata." />
        </CardContent>
      </Card>
    );
  } else if (currentTab === 'movimenti') {
    const movimenti = await prisma.movimentoMagazzino.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        parte: true,
        prodotto: true,
        variante: true,
        creatore: true,
      }
    });

    const columns = [
      { header: 'Data', accessor: (row: any) => row.createdAt.toLocaleString('it-IT') },
      { 
        header: 'Tipo', 
        accessor: (row: any) => (
          <Badge variant={
            row.tipo === 'CARICO' ? 'success' : 
            row.tipo === 'SCARICO' || row.tipo === 'VENDITA' ? 'destructive' : 
            row.tipo === 'ANNULLAMENTO' ? 'warning' : 'secondary'
          }>
            {row.tipo}
          </Badge>
        ) 
      },
      { 
        header: 'Entità', 
        accessor: (row: any) => {
          if (row.parte) return `Parte: ${row.parte.nome}`;
          if (row.variante) return `Variante: ${row.prodotto?.nome} - ${row.variante.nome}`;
          if (row.prodotto) return `Prodotto: ${row.prodotto.nome}`;
          return '-';
        }
      },
      { 
        header: 'Qty', 
        accessor: (row: any) => (
          <span className={`flex items-center font-medium ${row.quantita > 0 ? 'text-success' : 'text-danger'}`}>
            {row.quantita > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(row.quantita)}
          </span>
        ) 
      },
      { header: 'Prima', accessor: (row: any) => row.quantitaPrecedente },
      { header: 'Dopo', accessor: (row: any) => row.quantitaSuccessiva },
      { header: 'Operatore', accessor: (row: any) => `${row.creatore.nome} ${row.creatore.cognome}` },
      { header: 'Note', accessor: (row: any) => <span className="text-sm text-text-secondary truncate max-w-[150px] block" title={row.note}>{row.note || '-'}</span> },
    ];

    content = (
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ultimi 100 Movimenti</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white">
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="bg-white">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={movimenti} emptyMessage="Nessun movimento trovato." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Report" 
        description="Visualizza e scarica i report del magazzino."
      />

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/report?tab=${tab.id}`}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${currentTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }
              `}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {content}
    </div>
  );
}
