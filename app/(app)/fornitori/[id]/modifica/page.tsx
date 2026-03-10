import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { FornitoreForm } from '@/components/fornitori/FornitoreForm';

export default async function ModificaFornitorePage({ params }: { params: { id: string } }) {
  const fornitore = await prisma.fornitore.findUnique({
    where: { id: params.id },
  });

  if (!fornitore) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Modifica ${fornitore.nome}`} 
        description="Aggiorna i dettagli del fornitore."
        showBack
        backUrl="/fornitori"
      />
      
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <FornitoreForm initialData={fornitore} />
        </CardContent>
      </Card>
    </div>
  );
}
