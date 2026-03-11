'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { toast } from 'sonner';
import { salvaUtente } from '@/app/actions/utenti';
import { Loader2 } from 'lucide-react';

const utenteSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  cognome: z.string().min(1, 'Il cognome è obbligatorio'),
  email: z.string().email('Email non valida'),
  ruolo: z.enum(['ADMIN', 'MANAGER', 'VIEWER']),
  password: z.string().optional(),
  attivo: z.boolean().default(true),
}).refine(data => {
  if (!data.id && !data.password) {
    return false;
  }
  return true;
}, {
  message: 'La password è obbligatoria per i nuovi utenti',
  path: ['password'],
});

type UtenteFormValues = z.infer<typeof utenteSchema>;

interface UtenteFormProps {
  initialData?: Partial<UtenteFormValues>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UtenteForm({ initialData, onSuccess, onCancel }: UtenteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(utenteSchema),
    defaultValues: {
      id: initialData?.id || '',
      nome: initialData?.nome || '',
      cognome: initialData?.cognome || '',
      email: initialData?.email || '',
      ruolo: initialData?.ruolo || 'VIEWER',
      password: '',
      attivo: initialData?.attivo ?? true,
    },
  });

  const onSubmit = async (data: UtenteFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await salvaUtente(data);
      if (result.success) {
        toast.success(initialData?.id ? 'Utente aggiornato con successo' : 'Utente creato con successo');
        onSuccess();
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
    <form id="utente-form" onSubmit={handleSubmit((data: any) => onSubmit(data))} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Nome" error={errors.nome?.message} required>
          <Input {...register('nome')} placeholder="Es. Mario" />
        </FormField>
        
        <FormField label="Cognome" error={errors.cognome?.message} required>
          <Input {...register('cognome')} placeholder="Es. Rossi" />
        </FormField>
        
        <FormField label="Email" error={errors.email?.message} required className="md:col-span-2">
          <Input type="email" {...register('email')} placeholder="Es. mario.rossi@example.com" />
        </FormField>
        
        <FormField label="Ruolo" error={errors.ruolo?.message} required>
          <select 
            {...register('ruolo')} 
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ADMIN">Amministratore</option>
            <option value="MANAGER">Manager</option>
            <option value="VIEWER">Visualizzatore</option>
          </select>
        </FormField>
        
        <FormField label="Password" error={errors.password?.message} required={!initialData?.id}>
          <Input type="password" {...register('password')} placeholder={initialData?.id ? 'Lascia vuoto per non modificare' : 'Password'} />
        </FormField>
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="attivo" 
          {...register('attivo')} 
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="attivo" className="text-sm font-medium text-text-primary">
          Utente attivo
        </label>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-border">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/90">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Salva Modifiche' : 'Crea Utente'}
        </Button>
      </div>
    </form>
  );
}
