'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/FormField';
import { toast } from 'sonner';
import { annullaVendita } from '@/app/actions/vendite';
import { Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AnnullaVenditaButton({ venditaId }: { venditaId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [motivazione, setMotivazione] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnnulla = async () => {
    if (!motivazione.trim()) {
      toast.error('Inserisci una motivazione per l\'annullamento');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await annullaVendita(venditaId, motivazione);
      if (result.success) {
        toast.success('Vendita annullata con successo');
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Errore durante l\'annullamento');
      }
    } catch (error) {
      toast.error('Si è verificato un errore imprevisto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="text-danger border-danger hover:bg-danger/10"
        onClick={() => setIsOpen(true)}
      >
        <XCircle className="mr-2 h-4 w-4" />
        Annulla Vendita
      </Button>

      <Modal 
        open={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Annulla Vendita"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Chiudi
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleAnnulla} 
              disabled={isSubmitting || !motivazione.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conferma Annullamento
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Sei sicuro di voler annullare questa vendita? L'operazione ripristinerà le quantità dei prodotti in magazzino.
          </p>
          <FormField label="Motivazione" required>
            <Textarea 
              value={motivazione} 
              onChange={(e) => setMotivazione(e.target.value)} 
              placeholder="Inserisci la motivazione dell'annullamento..." 
              rows={3} 
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}
