import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Trophy,
  FolderOpen,
  PlusCircle,
  BarChart3,
  GitFork,
  Dices,
  Settings,
  Share2,
  ChevronDown,
  Cloud,
  Wifi
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenTournamentList,
  onOpenCreateModal,
  onOpenCloudModal
}) {
  const { activeTournament, tournamentList, cloudStatus } = useTournament();

  const getModeBadge = (mode) => {
    switch (mode) {
      case 'league':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">LIGA</span>;
      case 'cup':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">CUP (GRUP)</span>;
      case 'knockout':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md">BRACKET</span>;
      default:
        return null;
    }
  };

  const isCup = activeTournament?.mode === 'cup';
  const isLeague = activeTournament?.mode === 'league';
  const hasPlayoffs = activeTournament?.config?.hasPlayoffs;
  const isDoubleElim = activeTournament?.config?.playoffType === 'double_elim';

  // Dynamic Navigation items based on tournament mode
  const navItems = [
    {
      id: 'standings',
      label: isLeague ? 'Klasemen & Jadwal Liga' : 'Klasemen & Jadwal',
      icon: BarChart3
    },
    ...((isLeague && hasPlayoffs) || isCup || activeTournament?.mode === 'knockout'
      ? [{
          id: 'bracket',
          label: isLeague && isDoubleElim ? 'Playoff (Upper/Lower)' : 'Playoff Bracket',
          icon: GitFork,
          badge: isDoubleElim ? 'Upper/Lower' : null
        }]
      : []),
    ...(isCup
      ? [{ id: 'wheel', label: 'Undian Wheel Spin', icon: Dices, badge: 'Live Draw' }]
      : []),
    { id: 'setup', label: 'Pengaturan & Peserta', icon: Settings },
    { id: 'share', label: 'Share & Poster HD', icon: Share2, highlight: true }
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Active Tournament Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display uppercase tracking-wider text-xl sm:text-2xl font-bold text-gradient-esports leading-none">
                eFootball Manager
              </h1>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v2 PRO
              </span>
            </div>

            {/* Quick Switch Dropdown Trigger */}
            <button
              onClick={onOpenTournamentList}
              className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300 hover:text-white group transition"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold truncate max-w-[160px] sm:max-w-[240px] text-slate-200 group-hover:text-emerald-400">
                {activeTournament ? activeTournament.name : 'Pilih Turnamen...'}
              </span>
              {activeTournament && getModeBadge(activeTournament.mode)}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cloud Sync Status Indicator */}
          <button
            onClick={onOpenCloudModal}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white"
            title="Firebase Realtime Database Cloud Sync"
          >
            <Cloud className={`w-3.5 h-3.5 ${cloudStatus === 'connected' ? 'text-blue-400' : 'text-slate-500'}`} />
            <span className="text-[11px] hidden md:inline font-bold">Cloud</span>
            <span
              className={`w-2 h-2 rounded-full ${
                cloudStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : cloudStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-red-400'
              }`}
            />
          </button>

          {/* Tournament Manager Button */}
          <button
            onClick={onOpenTournamentList}
            className="px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title="Kelola Daftar Turnamen / Save Slots"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Save Slots ({tournamentList.length})</span>
          </button>

          {/* New Tournament Button */}
          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Turnamen</span>
          </button>
        </div>
      </div>

      {/* Secondary Navigation Tabs Bar */}
      <div className="border-t border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? tab.id === 'wheel'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : tab.id === 'share'
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isActive
                        ? 'bg-black/20 text-slate-950'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
