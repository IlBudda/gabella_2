'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/Modal';
import { UtenteForm } from './UtenteForm';
import { useRouter } from 'next/navigation';

interface UtentiClientProps {
  utenti: any[];
}

export function UtentiClient({ utenti }: UtentiClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUtente, setSelectedUtente] = useState<any | null>(null);

  const handleOpenModal = (utente?: any) => {
    setSelectedUtente(utente || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUtente(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    router.refresh();
  };

  const columns = [
    {
      header: 'Nome',
      accessor: (row: any) => <span className="font-medium">{row.nome}</span>,
    },
    {
      header: 'Cognome',
      accessor: (row: any) => <span className="font-medium">{row.cognome}</span>,
    },
    {
      header: 'Email',
      accessor: (row: any) => row.email,
    },
    {
      header: 'Ruolo',
      accessor: (row: any) => (
        <Badge variant={row.ruolo === 'ADMIN' ? 'default' : row.ruolo === 'MANAGER' ? 'secondary' : 'outline'}>
          {row.ruolo}
        </Badge>
      ),
    },
    {
      header: 'Stato',
      accessor: (row: any) => (
        <Badge variant={row.attivo ? 'success' : 'destructive'}>
          {row.attivo ? 'Attivo' : 'Disattivo'}
        </Badge>
      ),
    },
    {
      header: '',
      accessor: (row: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-text-secondary hover:text-primary"
            onClick={() => handleOpenModal(row)}
            title="Modifica"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Utenti" 
        description="Visualizza e gestisci gli accessi al sistema."
        action={
          <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Utente
          </Button>
        }
      />

      <DataTable 
        columns={columns} 
        data={utenti} 
        emptyMessage="Nessun utente trovato."
      />

      <Modal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        title={selectedUtente ? 'Modifica Utente' : 'Nuovo Utente'}
      >
        <UtenteForm 
          initialData={selectedUtente} 
          onSuccess={handleSuccess} 
          onCancel={handleCloseModal} 
        />
      </Modal>
    </div>
  );
}
