'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/FormField';
import { toast } from 'sonner';
import { salvaVendita, verificaDisponibilita } from '@/app/actions/vendite';
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';

const rigaSchema = z.object({
  prodottoId: z.string().min(1, 'Seleziona un prodotto'),
  varianteId: z.string().optional(),
  quantita: z.coerce.number().min(1, 'La quantità deve essere >= 1'),
  prezzoUnitario: z.coerce.number().min(0, 'Il prezzo deve essere >= 0'),
});

const venditaSchema = z.object({
  data: z.string().min(1, 'La data è obbligatoria'),
  clienteNome: z.string().optional(),
  clienteEmail: z.string().email('Email non valida').optional().or(z.literal('')),
  note: z.string().optional(),
  righe: z.array(rigaSchema).min(1, 'Aggiungi almeno un prodotto'),
});

type VenditaFormValues = z.infer<typeof venditaSchema>;

interface VenditaFormProps {
  prodotti: any[];
}

export function VenditaForm({ prodotti }: VenditaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(venditaSchema),
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      clienteNome: '',
      clienteEmail: '',
      note: '',
      righe: [{ prodottoId: '', varianteId: '', quantita: 1, prezzoUnitario: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'righe',
  });

  const righe = watch('righe') as any[];
  const totale = righe.reduce((acc, riga) => acc + (riga.quantita * riga.prezzoUnitario), 0);

  // Reset verification when rows change
  useEffect(() => {
    setIsVerified(false);
  }, [righe]);

  const handleProdottoChange = (index: number, prodottoId: string) => {
    const prodotto = prodotti.find(p => p.id === prodottoId);
    if (prodotto) {
      setValue(`righe.${index}.prezzoUnitario`, prodotto.prezzoVendita);
      setValue(`righe.${index}.varianteId`, ''); // Reset variante
    }
  };

  const handleVerifica = async () => {
    setIsVerifying(true);
    try {
      const { tuttoDisponibile, risultati } = await verificaDisponibilita(righe);
      setVerificationResults(risultati);
      setIsVerified(tuttoDisponibile);
      setShowVerificationModal(true);
    } catch (error) {
      toast.error('Errore durante la verifica della disponibilità');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: VenditaFormValues) => {
    if (!isVerified) {
      toast.error('Verifica la disponibilità prima di confermare la vendita');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await salvaVendita(data);
      if (result.success) {
        toast.success('Vendita confermata con successo');
        router.push('/vendite');
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

  const verificationColumns = [
    { header: 'Elemento', accessor: (row: any) => row.elemento },
    { header: 'Tipo', accessor: (row: any) => row.tipo },
    { header: 'Disponibile', accessor: (row: any) => row.disponibile },
    { header: 'Necessario', accessor: (row: any) => row.necessario },
    { 
      header: 'Stato', 
      accessor: (row: any) => row.sufficiente ? 
        <span className="flex items-center text-success"><CheckCircle className="w-4 h-4 mr-1" /> OK</span> : 
        <span className="flex items-center text-danger"><XCircle className="w-4 h-4 mr-1" /> Insufficiente</span> 
    },
  ];

  return (
    <form onSubmit={handleSubmit((data: any) => onSubmit(data))} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Sinistra (2/3) - Righe ordine */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Righe Ordine</h2>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => append({ prodottoId: '', varianteId: '', quantita: 1, prezzoUnitario: 0 })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi prodotto
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const selectedProdottoId = righe[index]?.prodottoId;
              const selectedProdotto = prodotti.find(p => p.id === selectedProdottoId);
              const hasVarianti = selectedProdotto?.varianti && selectedProdotto.varianti.length > 0;

              return (
                <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    
                    {/* Prodotto */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Prodotto</label>
                      <select 
                        {...register(`righe.${index}.prodottoId`)}
                        onChange={(e) => {
                          register(`righe.${index}.prodottoId`).onChange(e);
                          handleProdottoChange(index, e.target.value);
                        }}
                        className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <option value="">Seleziona...</option>
                        {prodotti.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                      {errors.righe?.[index]?.prodottoId && (
                        <p className="mt-1 text-xs text-danger">{errors.righe[index]?.prodottoId?.message}</p>
                      )}
                    </div>

                    {/* Variante */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Variante</label>
                      <select 
                        {...register(`righe.${index}.varianteId`)}
                        disabled={!hasVarianti}
                        className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <option value="">Nessuna variante</option>
                        {hasVarianti && selectedProdotto.varianti.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantità */}
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Q.tà</label>
                      <Input 
                        type="number" 
                        min="1" 
                        {...register(`righe.${index}.quantita`)} 
                      />
                      {errors.righe?.[index]?.quantita && (
                        <p className="mt-1 text-xs text-danger">{errors.righe[index]?.quantita?.message}</p>
                      )}
                    </div>

                    {/* Prezzo */}
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Prezzo (€)</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...register(`righe.${index}.prezzoUnitario`)} 
                      />
                      {errors.righe?.[index]?.prezzoUnitario && (
                        <p className="mt-1 text-xs text-danger">{errors.righe[index]?.prezzoUnitario?.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Subtotale e Rimuovi */}
                  <div className="flex items-center gap-4 mt-6 sm:mt-0">
                    <div className="text-right min-w-[80px]">
                      <label className="block text-xs font-medium text-text-secondary mb-1 sm:hidden">Subtotale</label>
                      <span className="font-medium">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format((righe[index]?.quantita || 0) * (righe[index]?.prezzoUnitario || 0))}
                      </span>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-text-secondary hover:text-danger hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.righe && typeof errors.righe.message === 'string' && (
            <p className="mt-4 text-sm text-danger font-medium">{errors.righe.message}</p>
          )}
        </div>
      </div>

      {/* Destra (1/3) - Pannello riepilogo sticky */}
      <div className="lg:col-span-1">
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm sticky top-6 space-y-6">
          
          <div>
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Riepilogo</h3>
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2">
              {righe.map((riga, i) => {
                const p = prodotti.find(prod => prod.id === riga.prodottoId);
                if (!p) return null;
                return (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-text-secondary truncate pr-4">{riga.quantita}x {p.nome}</span>
                    <span className="font-medium">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(riga.quantita * riga.prezzoUnitario)}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-4 border-t border-border flex justify-between items-end">
              <span className="text-base font-medium text-text-primary">Totale</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totale)}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-border">
            <FormField label="Data Vendita" error={errors.data?.message} required>
              <Input type="date" {...register('data')} />
            </FormField>
            
            <FormField label="Nome Cliente" error={errors.clienteNome?.message}>
              <Input {...register('clienteNome')} placeholder="Opzionale" />
            </FormField>
            
            <FormField label="Email Cliente" error={errors.clienteEmail?.message}>
              <Input type="email" {...register('clienteEmail')} placeholder="Opzionale" />
            </FormField>
            
            <FormField label="Note" error={errors.note?.message}>
              <Textarea {...register('note')} placeholder="Note interne..." rows={2} />
            </FormField>
          </div>

          <div className="pt-6 space-y-3">
            <Button 
              type="button" 
              variant="secondary" 
              className="w-full"
              onClick={handleVerifica}
              disabled={isVerifying || righe.some(r => !r.prodottoId)}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verifica disponibilità
            </Button>
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base"
              disabled={isSubmitting || !isVerified}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conferma Vendita
            </Button>
            {!isVerified && (
              <p className="text-xs text-center text-text-secondary">
                Verifica la disponibilità prima di confermare.
              </p>
            )}
          </div>
        </div>
      </div>

      <Modal 
        open={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
        title="Verifica Disponibilità"
        footer={
          <Button onClick={() => setShowVerificationModal(false)}>Chiudi</Button>
        }
      >
        <div className="space-y-4">
          {isVerified ? (
            <div className="p-4 bg-success/10 text-success rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">Tutti i prodotti sono disponibili in magazzino.</p>
            </div>
          ) : (
            <div className="p-4 bg-danger/10 text-danger rounded-lg flex items-center gap-3">
              <XCircle className="w-5 h-5" />
              <p className="font-medium">Attenzione: disponibilità insufficiente per alcuni prodotti.</p>
            </div>
          )}
          
          <DataTable 
            columns={verificationColumns} 
            data={verificationResults} 
            emptyMessage="Nessun risultato."
          />
        </div>
      </Modal>
    </form>
  );
}
