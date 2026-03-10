import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Mail, MapPin, Phone } from 'lucide-react';

export default async function FornitoreDetailPage({ params }: { params: { id: string } }) {
  const fornitore = await prisma.fornitore.findUnique({
    where: { id: params.id },
    include: {
      prodotti: {
        include: {
          prodotto: true,
        },
      },
      parti: {
        include: {
          parte: true,
        },
      },
    },
  });

  if (!fornitore) {
    notFound();
  }

  const prodottiColumns = [
    { header: 'Codice', accessor: (row: any) => row.prodotto.codice },
    { header: 'Nome', accessor: (row: any) => row.prodotto.nome },
    { header: 'Prezzo Acquisto', accessor: (row: any) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(row.prezzoAcquisto) },
    { header: 'Preferito', accessor: (row: any) => row.fornitorePreferito ? <Badge className="bg-success text-white">Sì</Badge> : <Badge variant="outline">No</Badge> },
  ];

  const partiColumns = [
    { header: 'Codice', accessor: (row: any) => row.parte.codice },
    { header: 'Nome', accessor: (row: any) => row.parte.nome },
    { header: 'Prezzo Acquisto', accessor: (row: any) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(row.prezzoAcquisto) },
    { header: 'Tempo Consegna', accessor: (row: any) => row.tempoConsegnaGiorni ? `${row.tempoConsegnaGiorni} gg` : '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={fornitore.nome} 
        description="Dettagli del fornitore e articoli forniti."
        showBack
        backUrl="/fornitori"
        action={
          <Link href={`/fornitori/${fornitore.id}/modifica`}>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Edit className="mr-2 h-4 w-4" />
              Modifica Fornitore
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-border shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Informazioni di Contatto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fornitore.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-text-secondary" />
                <a href={`mailto:${fornitore.email}`} className="text-primary hover:underline">{fornitore.email}</a>
              </div>
            )}
            {fornitore.telefono && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-text-secondary" />
                <a href={`tel:${fornitore.telefono}`} className="text-primary hover:underline">{fornitore.telefono}</a>
              </div>
            )}
            {fornitore.indirizzo && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-text-secondary mt-0.5" />
                <span className="text-text-primary">{fornitore.indirizzo}</span>
              </div>
            )}
            {fornitore.note && (
              <div className="pt-4 border-t border-border">
                <span className="text-sm text-text-secondary block mb-1">Note:</span>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{fornitore.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Prodotti Forniti</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={prodottiColumns} 
                data={fornitore.prodotti} 
                emptyMessage="Nessun prodotto fornito da questo fornitore."
              />
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Parti Fornite</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={partiColumns} 
                data={fornitore.parti} 
                emptyMessage="Nessuna parte fornita da questo fornitore."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
