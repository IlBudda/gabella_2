import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { FornitoreForm } from '@/components/fornitori/FornitoreForm';

export default function NuovoFornitorePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nuovo Fornitore" 
        description="Aggiungi un nuovo fornitore al sistema."
        showBack
        backUrl="/fornitori"
      />
      
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <FornitoreForm />
        </CardContent>
      </Card>
    </div>
  );
}
