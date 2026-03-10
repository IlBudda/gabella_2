import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  showBack?: boolean;
  backUrl?: string;
}

export function PageHeader({ title, description, action, showBack, backUrl = '#' }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link 
            href={backUrl}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
