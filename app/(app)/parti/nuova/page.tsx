import { PageHeader } from '@/components/ui/PageHeader';
import { ParteForm } from '@/components/parti/ParteForm';
import { Card, CardContent } from '@/components/ui/card';

export default function NuovaPartePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nuova Parte" 
        description="Aggiungi una nuova parte o componente al magazzino."
        showBack
        backUrl="/parti"
      />
      
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <ParteForm />
        </CardContent>
      </Card>
    </div>
  );
}
