import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useTournament();

  if (!toast) return null;

  const isWarning = toast.type === 'warning';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-semibold transition-all ${
          isWarning
            ? 'bg-amber-950/90 border-amber-500/40 text-amber-200 glow-gold'
            : isError
            ? 'bg-red-950/90 border-red-500/40 text-red-200 glow-danger'
            : 'bg-slate-900/95 border-emerald-500/40 text-emerald-300 glow-green'
        }`}
      >
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        ) : isError ? (
          <Info className="w-5 h-5 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
