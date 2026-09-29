import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Settings,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  RotateCcw,
  Check,
  Shield,
  Layers,
  GitFork,
  ClipboardPaste,
  History,
  Camera
} from 'lucide-react';

export default function SetupView({ onOpenBulkModal, onOpenHistoryModal }) {
  const {
    activeTournament,
    addTeam,
    removeTeam,
    updateConfig,
    setTeamGroup,
    regenerateTournamentSchedule,
    resetScores,
    createManualBackup
  } = useTournament();

  const [inputTeamName, setInputTeamName] = useState('');
  const [inputPlayerName, setInputPlayerName] = useState('');

  if (!activeTournament) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
        Pilih atau buat turnamen terlebih dahulu.
      </div>
    );
  }

  const { config, teams, mode } = activeTournament;
  const isCup = mode === 'cup';
  const isLeague = mode === 'league';
  const groupKeys = isCup ? ['A', 'B', 'C', 'D'].slice(0, config.groupCount || 2) : [];

  const handleAddTeamSubmit = (e) => {
    e.preventDefault();
    if (!inputTeamName.trim()) return;
    addTeam(inputTeamName, inputPlayerName);
    setInputTeamName('');
    setInputPlayerName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Pengaturan Turnamen: {activeTournament.name}
              </h2>
              <p className="text-xs text-slate-400">
                Sesuaikan format kompetisi, sistem playoff, poin, dan kelola peserta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => createManualBackup(`Manual Snapshot (${new Date().toLocaleTimeString('id-ID')})`)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Buat Cadangan Snapshot ke Cloud & Lokal Sekarang"
            >
              <Camera className="w-4 h-4" />
              <span>Simpan Snapshot Sekarang</span>
            </button>
          </div>
        </div>

        {/* Format & Rules Config Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Group / League Legs */}
          {mode !== 'knockout' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Jumlah Putaran {isLeague ? 'Liga' : 'Fase Grup'}:
              </label>
              <select
                value={config.groupLegs || 1}
                onChange={(e) => updateConfig({ groupLegs: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="1">1 Leg (Single Round Robin)</option>
                <option value="2">2 Leg (Home & Away - Rekomendasi)</option>
              </select>
              <p className="text-[11px] text-slate-500 italic">
                Setiap peserta akan bertanding {config.groupLegs || 1} kali melawan masing-masing lawan.
              </p>
            </div>
          )}

          {/* Points System */}
          {mode !== 'knockout' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Sistem Poin (M/S/K):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Menang</span>
                  <input
                    type="number"
                    value={config.winPts ?? 3}
                    onChange={(e) => updateConfig({ winPts: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Seri</span>
                  <input
                    type="number"
                    value={config.drawPts ?? 1}
                    onChange={(e) => updateConfig({ drawPts: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Kalah</span>
                  <input
                    type="number"
                    value={config.lossPts ?? 0}
                    onChange={(e) => updateConfig({ lossPts: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tie Breaker Rules */}
          {mode !== 'knockout' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Urutan Penentu Klasemen Seri:
              </label>
              <select
                value={config.tieBreaker || 'pts_gd_gf_h2h'}
                onChange={(e) => updateConfig({ tieBreaker: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="pts_gd_gf_h2h">Poin ➔ Selisih Gol (GD) ➔ Produktivitas (GF) ➔ Head-to-Head</option>
                <option value="pts_h2h_gd_gf">Poin ➔ Head-to-Head ➔ Selisih Gol (GD) ➔ Produktivitas (GF)</option>
              </select>
            </div>
          )}

        </div>

        {/* Playoff Configuration (for League mode) */}
        {isLeague && config.hasPlayoffs && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
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
              <div className="w-full text-center py-6 text-xs text-slate-500 italic">
                Belum ada tim terdaftar. Tambahkan peserta di atas atau klik "Paste Banyak Nama Sekaligus".
              </div>
            ) : (
              teams.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 group hover:border-slate-500 transition"
                >
                  <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                  <span className="text-white">{t.name || t}</span>
                  {t.player && <span className="text-[10px] text-slate-400">({t.player})</span>}
                  <button
                    onClick={() => removeTeam(t.id)}
                    className="text-slate-500 hover:text-red-400 p-0.5 rounded transition ml-1"
                    title="Hapus Tim"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Group Distribution (Cup Mode Only) */}
        {isCup && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
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
              if (window.confirm('Yakin ingin mereset semua skor pertandingan turnamen ini? (Sistem otomatis menyimpan snapshot cadangan sebelum mereset)')) {
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
              if (window.confirm('Generate ulang akan menyusun jadwal baru untuk semua peserta. (Sistem otomatis menyimpan snapshot cadangan sebelum generate)')) {
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
