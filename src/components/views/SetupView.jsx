import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Settings,
  Users,
  Plus,
  Trash2,
  RotateCcw,
  RefreshCw,
  GitFork,
  Layers,
  ClipboardPaste,
  Shield,
  X
} from 'lucide-react';

export default function SetupView({ onOpenBulkModal }) {
  const {
    activeTournament,
    updateConfig,
    addTeam,
    removeTeam,
    setTeamGroup,
    regenerateTournamentSchedule,
    resetScores,
    showToast
  } = useTournament();

  const [inputTeamName, setInputTeamName] = useState('');
  const [inputPlayerName, setInputPlayerName] = useState('');

  if (!activeTournament) return null;

  const mode = activeTournament.mode;
  const isLeague = mode === 'league';
  const isCup = mode === 'cup';
  const config = activeTournament.config || {};
  const teams = activeTournament.teams || [];
  const groupKeys = Object.keys(activeTournament.groups || {});

  const handleAddTeamSubmit = (e) => {
    e.preventDefault();
    if (!inputTeamName.trim()) return;

    addTeam(inputTeamName, inputPlayerName);
    setInputTeamName('');
    setInputPlayerName('');
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>Pengaturan Format & Peserta Turnamen</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sesuaikan aturan leg, zona playoff Upper/Lower bracket, dan kelola daftar peserta.
            </p>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Leg Matchday */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Leg Fase Grup / Liga:
            </label>
            <select
              value={config.groupLegs || 1}
              onChange={(e) => updateConfig({ groupLegs: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="1">1 Leg (Single Match)</option>
              <option value="2">2 Leg (Home & Away)</option>
            </select>
          </div>

          {/* Leg Knockout */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Leg Babak Playoff:
            </label>
            <select
              value={config.knockoutLegs || 1}
              onChange={(e) => updateConfig({ knockoutLegs: parseInt(e.target.value, 10) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="1">1 Leg (Tunggal / Single Match)</option>
              <option value="2">2 Leg (Agregat Home & Away)</option>
            </select>
          </div>

          {/* Cup Group Count */}
          {isCup && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Jumlah Grup Penyisihan:
              </label>
              <select
                value={config.groupCount || 2}
                onChange={(e) => updateConfig({ groupCount: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="2">2 Grup (Grup A & B)</option>
                <option value="4">4 Grup (Grup A, B, C, D)</option>
                <option value="8">8 Grup (Grup A s/d H)</option>
              </select>
            </div>
          )}

          {/* League Playoff System Selection */}
          {isLeague && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Sistem Playoff Liga:
              </label>
              <select
                value={config.hasPlayoffs ? config.playoffType : 'none'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'none') {
                    updateConfig({ hasPlayoffs: false, playoffType: 'none' });
                  } else {
                    updateConfig({ hasPlayoffs: true, playoffType: val });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="double_elim">🔥 Upper & Lower Bracket (Double Elim)</option>
                <option value="single_elim">⚡ Single Elimination Playoff</option>
                <option value="none">⚪ Liga Murni (Tanpa Playoff)</option>
              </select>
            </div>
          )}

        </div>

        {/* League Playoff Slots Configuration */}
        {isLeague && config.hasPlayoffs && (
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <GitFork className="w-4 h-4" /> Alokasi Peringkat Klasemen ke Playoff
            </h3>

            {config.playoffType === 'double_elim' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-400">
                    🟢 Jumlah Tim Lolos Upper Bracket:
                  </label>
                  <select
                    value={config.playoffUpperCount || 2}
                    onChange={(e) => updateConfig({ playoffUpperCount: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white"
                  >
                    <option value="2">Top 2 (Peringkat 1 - 2)</option>
                    <option value="4">Top 4 (Peringkat 1 - 4)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 italic block">Memiliki 2 nyawa (kalah turun ke Lower).</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-400">
                    🟡 Jumlah Tim Lolos Lower Bracket:
                  </label>
                  <select
                    value={config.playoffLowerCount || 2}
                    onChange={(e) => updateConfig({ playoffLowerCount: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white"
                  >
                    <option value="2">2 Tim Berikutnya</option>
                    <option value="4">4 Tim Berikutnya</option>
                  </select>
                  <span className="text-[10px] text-slate-500 italic block">Sudden death (kalah langsung tereliminasi).</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-400">
                  Total Tim Masuk Playoff:
                </label>
                <select
                  value={(config.playoffUpperCount || 2) + (config.playoffLowerCount || 2)}
                  onChange={(e) => {
                    const total = parseInt(e.target.value, 10);
                    updateConfig({ playoffUpperCount: total / 2, playoffLowerCount: total / 2 });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white"
                >
                  <option value="4">Top 4 Lolos Playoff</option>
                  <option value="8">Top 8 Lolos Playoff</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Manage Teams Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Kelola Daftar Peserta ({teams.length} Tim)</span>
            </h3>
            <button
              onClick={onOpenBulkModal}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Banyak Nama Sekaligus</span>
            </button>
          </div>

          {/* Add Team Form */}
          <form onSubmit={handleAddTeamSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={inputTeamName}
              onChange={(e) => setInputTeamName(e.target.value)}
              placeholder="Nama Tim eFootball (contoh: FC Barcelona)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              value={inputPlayerName}
              onChange={(e) => setInputPlayerName(e.target.value)}
              placeholder="Nama Player / Gamer Tag (opsional)..."
              className="w-full sm:w-56 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          {/* Teams Chip List */}
          <div className="flex flex-wrap gap-2 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 min-h-[90px] max-h-56 overflow-y-auto">
            {teams.length === 0 ? (
              <span className="text-slate-500 text-xs italic m-auto">
                Belum ada peserta. Tambahkan tim di atas!
              </span>
            ) : (
              teams.map((t) => (
                <div
                  key={t.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-200"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.name}</span>
                  {t.player && <span className="text-slate-500 font-normal">({t.player})</span>}
                  <button
                    onClick={() => removeTeam(t.id)}
                    className="text-slate-500 hover:text-red-400 transition ml-1"
                    title="Hapus peserta"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manual Group Assignment (For Cup mode) */}
        {isCup && groupKeys.length > 0 && (
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Pengaturan Pembagian Grup Manual Peserta</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {teams.map(t => {
                let currentG = 'NONE';
                for (let g in activeTournament.groups) {
                  if (activeTournament.groups[g]?.includes(t.name)) {
                    currentG = g;
                    break;
                  }
                }

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs"
                  >
                    <span className="font-bold text-slate-200 truncate pr-2">{t.name}</span>
                    <select
                      value={currentG}
                      onChange={(e) => setTeamGroup(t.name, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-xs font-bold text-amber-400 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-400"
                    >
                      <option value="NONE">- Pilih Grup -</option>
                      {groupKeys.map(g => (
                        <option key={g} value={g}>Grup {g}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Danger / Operational Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              if (window.confirm('Yakin ingin mereset semua skor pertandingan turnamen ini?')) {
                resetScores();
              }
            }}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Skor Pertandingan</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Generate ulang akan menyusun jadwal baru untuk semua peserta. Lanjutkan?')) {
                regenerateTournamentSchedule();
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Generate Ulang Jadwal & Bagan</span>
          </button>
        </div>

      </div>

    </div>
  );
}
