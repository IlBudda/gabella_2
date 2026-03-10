import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface StockBadgeProps {
  disponibile: number;
  minima: number;
}

export function StockBadge({ disponibile, minima }: StockBadgeProps) {
  const isCritical = disponibile <= minima;
  const isWarning = disponibile > minima && disponibile <= minima * 1.2;
  const isOk = disponibile > minima * 1.2;

  if (isCritical) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Critico ({disponibile})
      </span>
    );
  }

  if (isWarning) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Attenzione ({disponibile})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Regolare ({disponibile})
    </span>
  );
}
