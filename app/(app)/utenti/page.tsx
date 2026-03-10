import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UtentiClient } from '@/components/utenti/UtentiClient';

export const dynamic = 'force-dynamic';

export default async function UtentiPage() {
  const session = await auth();
  
  if ((session?.user as any)?.ruolo !== 'ADMIN') {
    redirect('/dashboard');
  }

  const utenti = await prisma.user.findMany({
    orderBy: { nome: 'asc' },
  });

  return <UtentiClient utenti={utenti} />;
}
