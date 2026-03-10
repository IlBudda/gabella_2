import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ProdottoMultiStepForm } from '@/components/prodotti/ProdottoMultiStepForm';
import { getPartiForBOM, getFornitoriForProdotto } from '@/app/actions/prodotti-completo';

export default async function ModificaProdottoPage({ params }: { params: { id: string } }) {
  const prodotto = await prisma.prodotto.findUnique({
    where: { id: params.id },
    include: {
      bom: true,
      varianti: true,
      fornitori: true,
    }
  });

  if (!prodotto) {
    notFound();
  }

  const parti = await getPartiForBOM();
  const fornitori = await getFornitoriForProdotto();

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Modifica ${prodotto.codice}`} 
        description="Aggiorna i dettagli del prodotto finito."
        showBack
        backUrl="/prodotti"
      />
      
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <ProdottoMultiStepForm initialData={prodotto} parti={parti} fornitori={fornitori} />
        </CardContent>
      </Card>
    </div>
  );
}
