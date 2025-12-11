'use client';

import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, PowerOff } from 'lucide-react';
import { ConnectionHealthStatus } from '@/types/connection';

interface Props {
  status: ConnectionHealthStatus;
  showLabel?: boolean;
}

export const ConnectionStatusBadge: React.FC<Props> = ({ status, showLabel = true }) => {
  // Mapowanie statusów z backendu na wygląd
  const config = {
      ONLINE: { 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      icon: CheckCircle2, 
      label: 'Online' 
    },
    OFFLINE: { 
      color: 'text-slate-500', 
      bg: 'bg-slate-500/10', 
      border: 'border-slate-500/20',
      icon: PowerOff, 
      label: 'Offline' 
    },
    ERROR: { 
      color: 'text-rose-500', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20',
      icon: XCircle, 
      label: 'Error' 
    },
    UNKNOWN: { 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20',
      icon: HelpCircle, 
      label: 'Unknown' 
    },
  };

  // Wybierz konfigurację lub domyślną (UNKNOWN) jeśli status nie pasuje
  const current = config[status] || config.UNKNOWN;
  const Icon = current.icon;

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border 
      ${current.bg} ${current.color} ${current.border}
    `}>
      <Icon size={14} />
      {showLabel && <span>{current.label}</span>}
    </div>
  );
};