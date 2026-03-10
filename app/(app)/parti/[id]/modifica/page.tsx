import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { ParteForm } from '@/components/parti/ParteForm';
import { Card, CardContent } from '@/components/ui/card';

export default async function ModificaPartePage({ params }: { params: { id: string } }) {
  const parte = await prisma.parte.findUnique({
    where: { id: params.id }
  });

  if (!parte) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Modifica Parte" 
        description={`Modifica i dettagli della parte ${parte.codice} - ${parte.nome}.`}
        showBack
        backUrl="/parti"
      />
      
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <ParteForm initialData={parte} />
        </CardContent>
      </Card>
    </div>
  );
}
