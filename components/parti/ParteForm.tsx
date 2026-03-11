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
import { salvaParte } from '@/app/actions/parti';
import { Loader2 } from 'lucide-react';

const parteSchema = z.object({
  id: z.string().optional(),
  codice: z.string().min(1, 'Il codice è obbligatorio'),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  descrizione: z.string().optional(),
  unitaMisura: z.string().min(1, "L'unità di misura è obbligatoria"),
  quantitaMinima: z.coerce.number().min(0, 'La quantità minima deve essere >= 0'),
  costoUnitario: z.coerce.number().min(0, 'Il costo unitario deve essere >= 0').optional(),
  note: z.string().optional(),
  attivo: z.boolean().default(true),
});

type ParteFormValues = z.infer<typeof parteSchema>;

interface ParteFormProps {
  initialData?: Partial<ParteFormValues>;
}

export function ParteForm({ initialData }: ParteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(parteSchema),
    defaultValues: {
      id: initialData?.id || '',
      codice: initialData?.codice || '',
      nome: initialData?.nome || '',
      descrizione: initialData?.descrizione || '',
      unitaMisura: initialData?.unitaMisura || 'PZ',
      quantitaMinima: initialData?.quantitaMinima || 0,
      costoUnitario: initialData?.costoUnitario || 0,
      note: initialData?.note || '',
      attivo: initialData?.attivo ?? true,
    },
  });

  const onSubmit = async (data: ParteFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await salvaParte(data);
      if (result.success) {
        toast.success(initialData?.id ? 'Parte aggiornata con successo' : 'Parte creata con successo');
        router.push('/parti');
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
    <form onSubmit={handleSubmit((data: any) => onSubmit(data))} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Codice" error={errors.codice?.message} required>
          <Input {...register('codice')} placeholder="Es. PRT-001" />
        </FormField>
        
        <FormField label="Nome" error={errors.nome?.message} required>
          <Input {...register('nome')} placeholder="Es. Vite M4" />
        </FormField>
        
        <FormField label="Unità di Misura" error={errors.unitaMisura?.message} required>
          <Input {...register('unitaMisura')} placeholder="Es. PZ, KG, MT" />
        </FormField>
        
        <FormField label="Quantità Minima" error={errors.quantitaMinima?.message} required>
          <Input type="number" step="0.01" {...register('quantitaMinima')} />
        </FormField>
        
        <FormField label="Costo Unitario (€)" error={errors.costoUnitario?.message}>
          <Input type="number" step="0.01" {...register('costoUnitario')} />
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
          Parte attiva
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
          {initialData?.id ? 'Salva Modifiche' : 'Crea Parte'}
        </Button>
      </div>
    </form>
  );
}
