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
import { salvaFornitore } from '@/app/actions/fornitori';
import { Loader2 } from 'lucide-react';

const fornitoreSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  telefono: z.string().optional(),
  indirizzo: z.string().optional(),
  piva: z.string().optional(),
  codiceFiscale: z.string().optional(),
  note: z.string().optional(),
});

type FornitoreFormValues = z.infer<typeof fornitoreSchema>;

interface FornitoreFormProps {
  initialData?: Partial<FornitoreFormValues>;
}

export function FornitoreForm({ initialData }: FornitoreFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FornitoreFormValues>({
    resolver: zodResolver(fornitoreSchema),
    defaultValues: {
      id: initialData?.id || '',
      nome: initialData?.nome || '',
      email: initialData?.email || '',
      telefono: initialData?.telefono || '',
      indirizzo: initialData?.indirizzo || '',
      piva: initialData?.piva || '',
      codiceFiscale: initialData?.codiceFiscale || '',
      note: initialData?.note || '',
    },
  });

  const onSubmit = async (data: FornitoreFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await salvaFornitore(data);
      if (result.success) {
        toast.success(initialData?.id ? 'Fornitore aggiornato con successo' : 'Fornitore creato con successo');
        router.push('/fornitori');
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
        <FormField label="Nome / Ragione Sociale" error={errors.nome?.message} required className="md:col-span-2">
          <Input {...register('nome')} placeholder="Es. Mario Rossi S.p.A." />
        </FormField>
        
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" {...register('email')} placeholder="Es. info@mariorossi.it" />
        </FormField>
        
        <FormField label="Telefono" error={errors.telefono?.message}>
          <Input {...register('telefono')} placeholder="Es. +39 012 3456789" />
        </FormField>
        
        <FormField label="Partita IVA" error={errors.piva?.message}>
          <Input {...register('piva')} placeholder="Es. 01234567890" />
        </FormField>
        
        <FormField label="Codice Fiscale" error={errors.codiceFiscale?.message}>
          <Input {...register('codiceFiscale')} placeholder="Es. RSSMRA..." />
        </FormField>
      </div>

      <FormField label="Indirizzo" error={errors.indirizzo?.message}>
        <Textarea {...register('indirizzo')} placeholder="Via, Città, CAP, Provincia" rows={2} />
      </FormField>

      <FormField label="Note" error={errors.note?.message}>
        <Textarea {...register('note')} placeholder="Note interne..." rows={3} />
      </FormField>

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
          {initialData?.id ? 'Salva Modifiche' : 'Crea Fornitore'}
        </Button>
      </div>
    </form>
  );
}
