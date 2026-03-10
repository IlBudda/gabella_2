import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ProdottoMultiStepForm } from '@/components/prodotti/ProdottoMultiStepForm';
import { getPartiForBOM, getFornitoriForProdotto } from '@/app/actions/prodotti-completo';

export const dynamic = 'force-dynamic';

export default async function NuovoProdottoPage() {
  const parti = await getPartiForBOM();
  const fornitori = await getFornitoriForProdotto();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nuovo Prodotto" 
        description="Aggiungi un nuovo prodotto finito al catalogo."
        showBack
        backUrl="/prodotti"
      />
      
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <ProdottoMultiStepForm parti={parti} fornitori={fornitori} />
        </CardContent>
      </Card>
    </div>
  );
}
