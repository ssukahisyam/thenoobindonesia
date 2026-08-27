import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Users, Layers, ShieldCheck, Trophy } from 'lucide-react';

export default function HeaderStats() {
  const { activeTournament, standingsMap } = useTournament();

  if (!activeTournament) return null;

  const teamCount = activeTournament.teams ? activeTournament.teams.length : 0;
  const mode = activeTournament.mode;
  const config = activeTournament.config || {};

  let modeLabel = 'Liga Penuh';
  let subModeInfo = `${config.groupLegs || 1} Leg Home-Away`;

  if (mode === 'cup') {
    modeLabel = `Cup (${config.groupCount || 2} Grup)`;
    subModeInfo = `Top ${config.advancePerGroup || 2} Lolos Playoff`;
  } else if (mode === 'knockout') {
    modeLabel = 'Bagan Knockout';
    subModeInfo = `${config.knockoutLegs || 1} Leg Match`;
  } else if (mode === 'league') {
    if (config.hasPlayoffs) {
      if (config.playoffType === 'double_elim') {
        subModeInfo = `Playoff: Upper (${config.playoffUpperCount || 2}) & Lower (${config.playoffLowerCount || 2})`;
      } else {
        subModeInfo = `Playoff: Single Elim (${(config.playoffUpperCount || 2) + (config.playoffLowerCount || 2)} Tim)`;
      }
    } else {
      subModeInfo = 'Liga Murni (Tanpa Playoff)';
    }
  }

  // Champion determination
  let championName = '-';
  if (mode === 'league' && !config.hasPlayoffs) {
    const ligaStandings = standingsMap['Liga'] || [];
    if (ligaStandings.length > 0 && ligaStandings[0].p > 0) {
      championName = ligaStandings[0].name;
    }
  } else if (activeTournament.doubleElimination?.champion) {
    championName = activeTournament.doubleElimination.champion;
  } else {
    const finalMatch = activeTournament.knockoutMatches?.find(m => m.id === 'FINAL');
    if (finalMatch && finalMatch.winner) {
      championName = finalMatch.winner;
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Stat 1: Total Peserta */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider truncate">
            Total Peserta
          </p>
          <p className="text-sm font-black text-white truncate">
            {teamCount} Tim / Player
          </p>
        </div>
      </div>

      {/* Stat 2: Format Turnamen */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider truncate">
            Format Mode
          </p>
          <p className="text-sm font-black text-emerald-400 truncate">
            {modeLabel}
          </p>
        </div>
      </div>

      {/* Stat 3: Sistem Playoff / Lolos */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider truncate">
            Aturan Playoff
          </p>
          <p className="text-xs font-black text-purple-300 truncate" title={subModeInfo}>
            {subModeInfo}
          </p>
        </div>
      </div>

      {/* Stat 4: Juara Turnamen */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider truncate">
            Juara Turnamen
          </p>
          <p
            className={`text-sm font-black truncate ${
              championName !== '-' ? 'text-amber-300' : 'text-slate-500'
            }`}
          >
            {championName}
          </p>
        </div>
      </div>
    </div>
  );
}
