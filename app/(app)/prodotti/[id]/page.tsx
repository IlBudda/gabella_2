import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockBadge } from '@/components/ui/StockBadge';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit } from 'lucide-react';

export default async function DettaglioProdottoPage({ params }: { params: { id: string } }) {
  const prodotto = await prisma.prodotto.findUnique({
    where: { id: params.id },
    include: {
      varianti: true,
      bom: {
        include: { parte: true }
      },
      fornitori: {
        include: { fornitore: true }
      },
      movimenti: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { creatore: { select: { nome: true, cognome: true } } }
      }
    }
  });

  if (!prodotto) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`${prodotto.codice} - ${prodotto.nome}`}
        description="Dettagli del prodotto finito"
        showBack
        backUrl="/prodotti"
        action={
          <Button asChild variant="outline">
            <Link href={`/prodotti/${prodotto.id}/modifica`}>
              <Edit className="w-4 h-4 mr-2" />
              Modifica
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informazioni Generali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Codice</p>
                  <p className="font-mono mt-1">{prodotto.codice}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Stato</p>
                  <div className="mt-1">
                    <Badge variant={prodotto.attivo ? 'success' : 'secondary'}>
                      {prodotto.attivo ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Categoria</p>
                  <p className="mt-1">{prodotto.categoria || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-text-secondary">Descrizione</p>
                  <p className="mt-1">{prodotto.descrizione || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-text-secondary">Note</p>
                  <p className="mt-1">{prodotto.note || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Distinta Base (BOM)</CardTitle>
            </CardHeader>
            <CardContent>
              {prodotto.bom.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">Nessuna distinta base definita.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2 font-medium text-text-secondary">Codice</th>
                        <th className="px-4 py-2 font-medium text-text-secondary">Parte</th>
                        <th className="px-4 py-2 font-medium text-text-secondary text-right">Q.tà Necessaria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {prodotto.bom.map((bomItem) => (
                        <tr key={bomItem.id}>
                          <td className="px-4 py-2 font-mono text-xs">{bomItem.parte.codice}</td>
                          <td className="px-4 py-2">
                            <Link href={`/parti/${bomItem.parteId}`} className="text-primary hover:underline">
                              {bomItem.parte.nome}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {bomItem.quantitaRichiesta} {bomItem.parte.unitaMisura}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Ultimi Movimenti</CardTitle>
            </CardHeader>
            <CardContent>
              {prodotto.movimenti.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">Nessun movimento registrato.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2 font-medium text-text-secondary">Data</th>
                        <th className="px-4 py-2 font-medium text-text-secondary">Tipo</th>
                        <th className="px-4 py-2 font-medium text-text-secondary text-right">Q.tà</th>
                        <th className="px-4 py-2 font-medium text-text-secondary">Utente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {prodotto.movimenti.map((m) => (
                        <tr key={m.id}>
                          <td className="px-4 py-2">{m.createdAt.toLocaleDateString('it-IT')}</td>
                          <td className="px-4 py-2">
                            <Badge variant={m.tipo === 'CARICO' ? 'success' : m.tipo === 'SCARICO' ? 'destructive' : 'secondary'}>
                              {m.tipo}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {m.tipo === 'SCARICO' ? '-' : '+'}{m.quantita}
                          </td>
                          <td className="px-4 py-2">{m.creatore.nome} {m.creatore.cognome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Giacenza</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Disponibilità Attuale</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">{prodotto.quantitaDisponibile}</span>
                </div>
                <div className="mt-2">
                  <StockBadge disponibile={prodotto.quantitaDisponibile} minima={prodotto.quantitaMinima} />
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-text-secondary">Soglia Minima</p>
                <p className="mt-1">{prodotto.quantitaMinima}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-text-secondary">Prezzo di Vendita</p>
                <p className="mt-1 font-medium text-lg">{formatCurrency(prodotto.prezzoVendita)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Varianti</CardTitle>
            </CardHeader>
            <CardContent>
              {prodotto.varianti.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">Nessuna variante definita.</p>
              ) : (
                <ul className="space-y-3">
                  {prodotto.varianti.map((v) => (
                    <li key={v.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-sm">{v.nome}</p>
                        <p className="text-xs text-text-secondary">{v.sku || 'Nessun SKU'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{v.quantitaDisponibile}</p>
                        <Badge variant={v.attivo ? 'success' : 'secondary'} className="mt-1">
                          {v.attivo ? 'Attivo' : 'Inattivo'}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Fornitori</CardTitle>
            </CardHeader>
            <CardContent>
              {prodotto.fornitori.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">Nessun fornitore associato.</p>
              ) : (
                <ul className="space-y-3">
                  {prodotto.fornitori.map((pf) => (
                    <li key={pf.fornitoreId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-sm">{pf.fornitore.nome}</p>
                        <p className="text-xs text-text-secondary">{pf.fornitorePreferito ? 'Fornitore Preferito' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{pf.prezzoAcquisto ? formatCurrency(pf.prezzoAcquisto) : '-'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
