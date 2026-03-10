import { PageHeader } from '@/components/ui/PageHeader';
import { VenditaForm } from '@/components/vendite/VenditaForm';
import { getProdottiForVendita } from '@/app/actions/vendite';

export default async function NuovaVenditaPage() {
  const prodotti = await getProdottiForVendita();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nuova Vendita" 
        description="Registra una nuova vendita e aggiorna il magazzino."
        showBack
        backUrl="/vendite"
      />
      
      <VenditaForm prodotti={prodotti} />
    </div>
  );
}
