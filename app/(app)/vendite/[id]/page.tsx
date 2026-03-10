import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AnnullaVenditaButton } from '@/components/vendite/AnnullaVenditaButton';

export default async function VenditaDetailPage({ params }: { params: { id: string } }) {
  const vendita = await prisma.vendita.findUnique({
    where: { id: params.id },
    include: {
      creatore: true,
      righe: {
        include: {
          prodotto: true,
          variante: true,
        },
      },
    },
  });

  if (!vendita) {
    notFound();
  }

  const columns = [
    { header: 'Prodotto', accessor: (row: any) => row.prodotto.nome },
    { header: 'Variante', accessor: (row: any) => row.variante?.nome || '-' },
    { header: 'Quantità', accessor: (row: any) => row.quantita },
    { header: 'Prezzo Unitario', accessor: (row: any) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(row.prezzoUnitario) },
    { header: 'Subtotale', accessor: (row: any) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(row.subtotale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Ordine ${vendita.numeroOrdine}`} 
        description={`Registrato il ${format(new Date(vendita.data), 'dd MMMM yyyy', { locale: it })} da ${vendita.creatore.nome} ${vendita.creatore.cognome}`}
        showBack
        backUrl="/vendite"
        action={
          !vendita.annullata && (
            <AnnullaVenditaButton venditaId={vendita.id} />
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Dettaglio Righe</CardTitle>
              {vendita.annullata ? (
                <Badge variant="destructive">Annullata</Badge>
              ) : (
                <Badge variant="success">Completata</Badge>
              )}
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={vendita.righe} 
                emptyMessage="Nessuna riga trovata."
              />
              
              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <div className="text-right">
                  <span className="text-sm text-text-secondary mr-4">Totale Ordine</span>
                  <span className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(vendita.totale)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Informazioni Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-text-secondary block mb-1">Nome Cliente</span>
                <span className="font-medium text-text-primary">{vendita.clienteNome || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-text-secondary block mb-1">Email Cliente</span>
                {vendita.clienteEmail ? (
                  <a href={`mailto:${vendita.clienteEmail}`} className="text-primary hover:underline">{vendita.clienteEmail}</a>
                ) : (
                  <span className="text-text-primary">-</span>
                )}
              </div>
              {vendita.note && (
                <div className="pt-4 border-t border-border">
                  <span className="text-sm text-text-secondary block mb-1">Note Ordine</span>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{vendita.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {vendita.annullata && vendita.motivazioneAnnullamento && (
            <Card className="border-danger/20 bg-danger/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-danger">Motivazione Annullamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-danger">{vendita.motivazioneAnnullamento}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
