'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/FormField';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { salvaProdottoCompleto } from '@/app/actions/prodotti-completo';

interface ProdottoMultiStepFormProps {
  initialData?: any;
  parti: any[];
  fornitori: any[];
}

export function ProdottoMultiStepForm({ initialData, parti, fornitori }: ProdottoMultiStepFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Step 1: Base
  const [base, setBase] = useState({
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
  });

  // State for Step 2: BOM
  const [bom, setBom] = useState<any[]>(initialData?.bom || []);

  // State for Step 3: Varianti
  const [hasVarianti, setHasVarianti] = useState(initialData?.varianti?.length > 0);
  const [varianti, setVarianti] = useState<any[]>(initialData?.varianti || []);

  // State for Step 4: Fornitori
  const [fornitoriSelezionati, setFornitoriSelezionati] = useState<any[]>(initialData?.fornitori || []);

  const steps = [
    { id: 1, title: 'Informazioni Base' },
    { id: 2, title: 'Distinta Base (BOM)' },
    { id: 3, title: 'Varianti' },
    { id: 4, title: 'Fornitori' },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!base.codice || !base.nome || !base.unitaMisura) {
        toast.error('Compila i campi obbligatori (Codice, Nome, Unità di Misura)');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        base,
        bom,
        varianti: hasVarianti ? varianti : [],
        fornitori: fornitoriSelezionati,
      };

      const result = await salvaProdottoCompleto(data);
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
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-medium text-sm transition-colors
              ${currentStep > step.id ? 'bg-success border-success text-white' : 
                currentStep === step.id ? 'border-primary text-primary bg-primary/10' : 
                'border-border text-text-secondary'}
            `}>
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:block
              ${currentStep >= step.id ? 'text-text-primary' : 'text-text-secondary'}
            `}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-colors
                ${currentStep > step.id ? 'bg-success' : 'bg-border'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm min-h-[400px]">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Informazioni Base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Codice SKU" required>
                <Input value={base.codice} onChange={e => setBase({...base, codice: e.target.value})} placeholder="Es. PRD-001" />
              </FormField>
              <FormField label="Nome" required>
                <Input value={base.nome} onChange={e => setBase({...base, nome: e.target.value})} placeholder="Es. Tavolo in Legno" />
              </FormField>
              <FormField label="Categoria">
                <Input value={base.categoria} onChange={e => setBase({...base, categoria: e.target.value})} placeholder="Es. Arredamento" />
              </FormField>
              <FormField label="Unità di Misura" required>
                <Input value={base.unitaMisura} onChange={e => setBase({...base, unitaMisura: e.target.value})} placeholder="Es. PZ, SET" />
              </FormField>
              <FormField label="Quantità Minima" required>
                <Input type="number" value={base.quantitaMinima} onChange={e => setBase({...base, quantitaMinima: Number(e.target.value)})} />
              </FormField>
              <FormField label="Prezzo di Vendita (€)" required>
                <Input type="number" step="0.01" value={base.prezzoVendita} onChange={e => setBase({...base, prezzoVendita: Number(e.target.value)})} />
              </FormField>
            </div>
            <FormField label="Descrizione">
              <Textarea value={base.descrizione} onChange={e => setBase({...base, descrizione: e.target.value})} rows={3} />
            </FormField>
            <FormField label="Note">
              <Textarea value={base.note} onChange={e => setBase({...base, note: e.target.value})} rows={2} />
            </FormField>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="attivo" checked={base.attivo} onChange={e => setBase({...base, attivo: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="attivo" className="text-sm font-medium text-text-primary">Prodotto attivo</label>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Componenti necessari per 1 unità di prodotto</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setBom([...bom, { parteId: '', quantitaRichiesta: 1 }])}>
                <Plus className="w-4 h-4 mr-2" /> Aggiungi componente
              </Button>
            </div>
            
            {bom.length === 0 ? (
              <div className="text-center py-8 text-text-secondary bg-background/50 rounded-lg border border-dashed border-border">
                Nessun componente aggiunto. Clicca su "Aggiungi componente" per iniziare.
              </div>
            ) : (
              <div className="space-y-4">
                {bom.map((item, index) => {
                  const selectedParte = parti.find(p => p.id === item.parteId);
                  return (
                    <div key={index} className="flex items-end gap-4 p-4 border border-border rounded-lg bg-background/50">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Parte</label>
                        <select 
                          value={item.parteId}
                          onChange={e => {
                            const newBom = [...bom];
                            newBom[index].parteId = e.target.value;
                            setBom(newBom);
                          }}
                          className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <option value="">Seleziona parte...</option>
                          {parti.map(p => (
                            <option key={p.id} value={p.id}>{p.codice} - {p.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Q.tà Richiesta</label>
                        <Input 
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          value={item.quantitaRichiesta} 
                          onChange={e => {
                            const newBom = [...bom];
                            newBom[index].quantitaRichiesta = Number(e.target.value);
                            setBom(newBom);
                          }} 
                        />
                      </div>
                      <div className="w-32 hidden sm:block">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Disponibile</label>
                        <div className={`h-10 flex items-center px-3 rounded-md border ${selectedParte ? (selectedParte.quantitaDisponibile >= item.quantitaRichiesta ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger') : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                          {selectedParte ? `${selectedParte.quantitaDisponibile} ${selectedParte.unitaMisura}` : '-'}
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setBom(bom.filter((_, i) => i !== index))} className="text-text-secondary hover:text-danger hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Varianti Prodotto</h2>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="hasVarianti" checked={hasVarianti} onChange={e => setHasVarianti(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="hasVarianti" className="text-sm font-medium text-text-primary">Questo prodotto ha varianti?</label>
              </div>
            </div>

            {hasVarianti && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setVarianti([...varianti, { id: '', nome: '', sku: '', quantitaMinima: 0, prezzoOverride: null }])}>
                    <Plus className="w-4 h-4 mr-2" /> Aggiungi variante
                  </Button>
                </div>
                
                {varianti.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary bg-background/50 rounded-lg border border-dashed border-border">
                    Nessuna variante aggiunta.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {varianti.map((v, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-4 border border-border rounded-lg bg-background/50 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-text-secondary mb-1">Nome Variante</label>
                          <Input value={v.nome} onChange={e => { const newV = [...varianti]; newV[index].nome = e.target.value; setVarianti(newV); }} placeholder="Es. Rosso, XL" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">SKU</label>
                          <Input value={v.sku} onChange={e => { const newV = [...varianti]; newV[index].sku = e.target.value; setVarianti(newV); }} placeholder="SKU Variante" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Q.tà Minima</label>
                          <Input type="number" value={v.quantitaMinima} onChange={e => { const newV = [...varianti]; newV[index].quantitaMinima = Number(e.target.value); setVarianti(newV); }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-text-secondary mb-1">Prezzo Override (€)</label>
                            <Input type="number" step="0.01" value={v.prezzoOverride || ''} onChange={e => { const newV = [...varianti]; newV[index].prezzoOverride = e.target.value ? Number(e.target.value) : null; setVarianti(newV); }} placeholder="Opzionale" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setVarianti(varianti.filter((_, i) => i !== index))} className="text-text-secondary hover:text-danger hover:bg-red-50 mb-0.5">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Fornitori Associati</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setFornitoriSelezionati([...fornitoriSelezionati, { fornitoreId: '', prezzoAcquisto: 0, fornitorePreferito: false }])}>
                <Plus className="w-4 h-4 mr-2" /> Aggiungi fornitore
              </Button>
            </div>

            {fornitoriSelezionati.length === 0 ? (
              <div className="text-center py-8 text-text-secondary bg-background/50 rounded-lg border border-dashed border-border">
                Nessun fornitore associato.
              </div>
            ) : (
              <div className="space-y-4">
                {fornitoriSelezionati.map((f, index) => (
                  <div key={index} className="flex items-end gap-4 p-4 border border-border rounded-lg bg-background/50">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Fornitore</label>
                      <select 
                        value={f.fornitoreId}
                        onChange={e => {
                          const newF = [...fornitoriSelezionati];
                          newF[index].fornitoreId = e.target.value;
                          setFornitoriSelezionati(newF);
                        }}
                        className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="">Seleziona fornitore...</option>
                        {fornitori.map(forn => (
                          <option key={forn.id} value={forn.id}>{forn.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Prezzo Acquisto</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={f.prezzoAcquisto} 
                        onChange={e => {
                          const newF = [...fornitoriSelezionati];
                          newF[index].prezzoAcquisto = Number(e.target.value);
                          setFornitoriSelezionati(newF);
                        }} 
                      />
                    </div>
                    <div className="flex items-center gap-2 h-10 px-2">
                      <input 
                        type="checkbox" 
                        id={`pref-${index}`}
                        checked={f.fornitorePreferito}
                        onChange={e => {
                          const newF = [...fornitoriSelezionati];
                          newF[index].fornitorePreferito = e.target.checked;
                          setFornitoriSelezionati(newF);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`pref-${index}`} className="text-sm text-text-secondary">Preferito</label>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setFornitoriSelezionati(fornitoriSelezionati.filter((_, i) => i !== index))} className="text-text-secondary hover:text-danger hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handlePrev}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Indietro
        </Button>
        
        {currentStep < 4 ? (
          <Button type="button" onClick={handleNext} className="bg-primary text-white hover:bg-primary/90">
            Avanti <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva Prodotto <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
