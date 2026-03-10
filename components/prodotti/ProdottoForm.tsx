'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/FormField';
import { toast } from 'sonner';
import { salvaProdotto } from '@/app/actions/prodotti';
import { Loader2 } from 'lucide-react';

const prodottoSchema = z.object({
  id: z.string().optional(),
  codice: z.string().min(1, 'Il codice è obbligatorio'),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  descrizione: z.string().optional(),
  categoria: z.string().optional(),
  unitaMisura: z.string().min(1, 'L\'unità di misura è obbligatoria'),
  quantitaMinima: z.coerce.number().min(0, 'La quantità minima deve essere >= 0'),
  prezzoVendita: z.coerce.number().min(0, 'Il prezzo di vendita deve essere >= 0'),
  note: z.string().optional(),
  attivo: z.boolean().default(true),
});

type ProdottoFormValues = z.infer<typeof prodottoSchema>;

interface ProdottoFormProps {
  initialData?: Partial<ProdottoFormValues>;
}

export function ProdottoForm({ initialData }: ProdottoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProdottoFormValues>({
    resolver: zodResolver(prodottoSchema),
    defaultValues: {
      id: initialData?.id || '',
      codice: initialData?.codice || '',
      nome: initialData?.nome || '',
      descrizione: initialData?.descrizione || '',
      categoria: initialData?.categoria || '',
      unitaMisura: initialData?.unitaMisura || 'PZ',
      quantitaMinima: initialData?.quantitaMinima || 0,
      prezzoVendita: initialData?.prezzoVendita || 0,
      note: initialData?.note || '',
      attivo: initialData?.attivo ?? true,
    },
  });

  const onSubmit = async (data: ProdottoFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await salvaProdotto(data);
      if (result.success) {
        toast.success(initialData?.id ? 'Prodotto aggiornato con successo' : 'Prodotto creato con successo');
        router.push('/prodotti');
        router.refresh();
      } else {
        toast.error(result.error || 'Errore durante il salvataggio');
      }
    } catch (error) {
      toast.error('Si è verificato un errore imprevisto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Codice" error={errors.codice?.message} required>
          <Input {...register('codice')} placeholder="Es. PRD-001" />
        </FormField>
        
        <FormField label="Nome" error={errors.nome?.message} required>
          <Input {...register('nome')} placeholder="Es. Tavolo in Legno" />
        </FormField>
        
        <FormField label="Categoria" error={errors.categoria?.message}>
          <Input {...register('categoria')} placeholder="Es. Arredamento" />
        </FormField>
        
        <FormField label="Unità di Misura" error={errors.unitaMisura?.message} required>
          <Input {...register('unitaMisura')} placeholder="Es. PZ, SET" />
        </FormField>
        
        <FormField label="Quantità Minima" error={errors.quantitaMinima?.message} required>
          <Input type="number" step="0.01" {...register('quantitaMinima')} />
        </FormField>
        
        <FormField label="Prezzo di Vendita (€)" error={errors.prezzoVendita?.message} required>
          <Input type="number" step="0.01" {...register('prezzoVendita')} />
        </FormField>
      </div>

      <FormField label="Descrizione" error={errors.descrizione?.message}>
        <Textarea {...register('descrizione')} placeholder="Descrizione dettagliata..." rows={3} />
      </FormField>

      <FormField label="Note" error={errors.note?.message}>
        <Textarea {...register('note')} placeholder="Note interne..." rows={2} />
      </FormField>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="attivo" 
          {...register('attivo')} 
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="attivo" className="text-sm font-medium text-text-primary">
          Prodotto attivo
        </label>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-border">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/90">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Salva Modifiche' : 'Crea Prodotto'}
        </Button>
      </div>
    </form>
  );
}
