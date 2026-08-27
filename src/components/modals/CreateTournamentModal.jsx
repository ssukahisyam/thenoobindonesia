import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { TOURNAMENT_MODES, PLAYOFF_TYPES, DEFAULT_CONFIG } from '../../models/tournament';
import {
  Trophy,
  X,
  Layers,
  Users,
  GitFork,
  ArrowRight,
  Flame,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const PRESET_TEAMS = {
  4: [
    { name: 'FC Barcelona', player: 'Rian' },
    { name: 'Arsenal FC', player: 'Budi' },
    { name: 'Real Madrid', player: 'Deni' },
    { name: 'Bayern München', player: 'Eko' }
  ],
  6: [
    { name: 'FC Barcelona', player: 'Rian' },
    { name: 'Arsenal FC', player: 'Budi' },
    { name: 'Real Madrid', player: 'Deni' },
    { name: 'Bayern München', player: 'Eko' },
    { name: 'AC Milan', player: 'Bayu' },
    { name: 'Inter Milan', player: 'Andi' }
  ],
  8: [
    { name: 'FC Barcelona', player: 'Rian' },
    { name: 'Arsenal FC', player: 'Budi' },
    { name: 'Real Madrid', player: 'Deni' },
    { name: 'Bayern München', player: 'Eko' },
    { name: 'AC Milan', player: 'Bayu' },
    { name: 'Inter Milan', player: 'Andi' },
    { name: 'Manchester City', player: 'Dimas' },
    { name: 'Paris Saint-Germain', player: 'Fajar' }
  ],
  12: [
    { name: 'FC Barcelona', player: 'Player 1' },
    { name: 'Arsenal FC', player: 'Player 2' },
    { name: 'Real Madrid', player: 'Player 3' },
    { name: 'Bayern München', player: 'Player 4' },
    { name: 'AC Milan', player: 'Player 5' },
    { name: 'Inter Milan', player: 'Player 6' },
    { name: 'Manchester City', player: 'Player 7' },
    { name: 'Paris Saint-Germain', player: 'Player 8' },
    { name: 'Liverpool FC', player: 'Player 9' },
    { name: 'Chelsea FC', player: 'Player 10' },
    { name: 'Juventus', player: 'Player 11' },
    { name: 'Atletico Madrid', player: 'Player 12' }
  ]
};

export default function CreateTournamentModal({ isOpen, onClose }) {
  const { createNewTournament } = useTournament();

  const [name, setName] = useState('');
  // Default to League + Playoff MPL (what user wants)
  const [selectedFormat, setSelectedFormat] = useState('league_mpl'); 
  const [groupLegs, setGroupLegs] = useState(2); // 2 leg default
  const [presetCount, setPresetCount] = useState(null);
  const [customTeamsText, setCustomTeamsText] = useState('');

  // Cup specific
  const [groupCount, setGroupCount] = useState(2);
  const [advancePerGroup, setAdvancePerGroup] = useState(2);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let teamList = [];
    if (customTeamsText.trim()) {
      const lines = customTeamsText.split('\n').map(l => l.trim()).filter(Boolean);
      teamList = lines.map((teamName, i) => ({
        id: `t_${Date.now()}_${i}`,
        name: teamName,
        player: `Player ${i + 1}`
      }));
    } else if (presetCount) {
      const defaultPreset = PRESET_TEAMS[presetCount] || PRESET_TEAMS[6];
      teamList = defaultPreset.map((t, i) => ({
        id: `t_${Date.now()}_${i}`,
        name: t.name,
        player: t.player
      }));
    } else {
      // Default 6 teams
      teamList = PRESET_TEAMS[6].map((t, i) => ({
        id: `t_${Date.now()}_${i}`,
        name: t.name,
        player: t.player
      }));
    }

    let mode = TOURNAMENT_MODES.LEAGUE;
    let config = { ...DEFAULT_CONFIG };

    if (selectedFormat === 'league_mpl') {
      mode = TOURNAMENT_MODES.LEAGUE;
      config = {
        ...DEFAULT_CONFIG,
        mode: TOURNAMENT_MODES.LEAGUE,
        groupLegs: parseInt(groupLegs, 10),
        hasPlayoffs: true,
        playoffType: PLAYOFF_TYPES.DOUBLE_ELIM,
        playoffUpperCount: 2,
        playoffLowerCount: teamList.length >= 6 ? 4 : 2,
        knockoutLegs: 1
      };
    } else if (selectedFormat === 'league_pure') {
      mode = TOURNAMENT_MODES.LEAGUE;
      config = {
        ...DEFAULT_CONFIG,
        mode: TOURNAMENT_MODES.LEAGUE,
        groupLegs: parseInt(groupLegs, 10),
        hasPlayoffs: false,
        playoffType: PLAYOFF_TYPES.NONE
      };
    } else if (selectedFormat === 'cup') {
      mode = TOURNAMENT_MODES.CUP;
      config = {
        ...DEFAULT_CONFIG,
        mode: TOURNAMENT_MODES.CUP,
        groupCount: parseInt(groupCount, 10),
        advancePerGroup: parseInt(advancePerGroup, 10),
        groupLegs: parseInt(groupLegs, 10),
        knockoutLegs: 1
      };
    } else if (selectedFormat === 'knockout_pure') {
      mode = TOURNAMENT_MODES.KNOCKOUT;
      config = {
        ...DEFAULT_CONFIG,
        mode: TOURNAMENT_MODES.KNOCKOUT,
        knockoutLegs: 1
      };
    }

    createNewTournament({
      name: name.trim() || 'Turnamen eFootball 2026',
      mode,
      config,
      teams: teamList
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Buat Turnamen Baru
              </h2>
              <p className="text-xs text-slate-400">
                Pilih format turnamen, isi nama pemain, dan jadwal serta klasemen langsung otomatis tersusun.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
          
          {/* Tournament Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Nama Turnamen:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Turnamen eFootball Ramadan Cup 2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 font-semibold transition"
            />
          </div>

          {/* Tournament Format Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pilih Format Turnamen:
            </label>

            <div className="space-y-2.5">
              
              {/* Option 1: Liga + Playoff MPL (Recommended) */}
              <button
                type="button"
                onClick={() => setSelectedFormat('league_mpl')}
                className={`w-full p-4 rounded-2xl border text-left transition relative ${
                  selectedFormat === 'league_mpl'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white glow-green'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      Liga Penuh + Playoff Upper & Lower Bracket (Sistem MPL)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950">
                      FAVORIT
                    </span>
                  </div>
                  {selectedFormat === 'league_mpl' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Semua pemain bertanding di <b>Klasemen Liga & Jadwal Lengkap</b>. Skor diisi ➔ Klasemen otomatis update ➔ <b>Peringkat 1 & 2 menunggu di Upper Semis, Peringkat 3-6 bertanding di Play-in</b>, sisanya gugur.
                </p>
              </button>

              {/* Option 2: Liga Murni (Round Robin) */}
              <button
                type="button"
                onClick={() => setSelectedFormat('league_pure')}
                className={`w-full p-3.5 rounded-2xl border text-left transition relative ${
                  selectedFormat === 'league_pure'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white glow-green'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Liga Penuh Murni (Tanpa Babak Playoff)
                  </span>
                  {selectedFormat === 'league_pure' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Semua pemain bertanding dalam satu klasemen liga penuh. Juara ditentukan langsung dari peringkat 1 klasemen akhir.
                </p>
              </button>

              {/* Option 3: Cup (Fase Grup + Playoff) */}
              <button
                type="button"
                onClick={() => setSelectedFormat('cup')}
                className={`w-full p-3.5 rounded-2xl border text-left transition relative ${
                  selectedFormat === 'cup'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white glow-green'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Mode Cup / Piala (Fase Grup + Undian Wheel Spin ➔ Playoff)
                  </span>
                  {selectedFormat === 'cup' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Peserta dibagi ke dalam beberapa grup (Grup A, Grup B, dst) dengan Roda Spin Fair-Play, lalu tim teratas melaju ke babak gugur.
                </p>
              </button>

              {/* Option 4: Knockout Murni */}
              <button
                type="button"
                onClick={() => setSelectedFormat('knockout_pure')}
                className={`w-full p-3.5 rounded-2xl border text-left transition relative ${
                  selectedFormat === 'knockout_pure'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white glow-green'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <GitFork className="w-4 h-4 text-purple-400" />
                    Bagan Pohon Eliminasi Murni (Knockout Bracket Saja)
                  </span>
                  {selectedFormat === 'knockout_pure' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Langsung bertanding di bagan pohon gugur (*Single Elimination*) tanpa klasemen liga.
                </p>
              </button>

            </div>
          </div>

          {/* Conditional Match Leg Selector (Only for League & Cup) */}
          {selectedFormat !== 'knockout_pure' && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Jumlah Leg Pertandingan Liga / Grup:
              </label>
              <select
                value={groupLegs}
                onChange={(e) => setGroupLegs(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="2">2 Leg (Home & Away - Rekomendasi)</option>
                <option value="1">1 Leg (Single Match)</option>
              </select>
            </div>
          )}

          {/* Conditional Cup Settings */}
          {selectedFormat === 'cup' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">Jumlah Grup:</label>
                <select
                  value={groupCount}
                  onChange={(e) => setGroupCount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white"
                >
                  <option value="2">2 Grup (Grup A & B)</option>
                  <option value="4">4 Grup (Grup A, B, C, D)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">Lolos Per Grup:</label>
                <select
                  value={advancePerGroup}
                  onChange={(e) => setAdvancePerGroup(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white"
                >
                  <option value="2">Top 2 Lolos Playoff</option>
                  <option value="1">Top 1 Lolos Playoff</option>
                </select>
              </div>
            </div>
          )}

          {/* Paste Team Names Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Daftar Peserta / Pemain:
              </label>
              <span className="text-xs text-emerald-400 font-bold">
                1 Baris = 1 Pemain
              </span>
            </div>

            <textarea
              rows="7"
              value={customTeamsText}
              onChange={(e) => setCustomTeamsText(e.target.value)}
              placeholder="Paste atau ketik nama peserta di sini (contoh):&#10;Hisyam&#10;Siraj&#10;Tegar&#10;Amin&#10;Ghossani&#10;Alwi&#10;Panuntun&#10;Alan&#10;Alim"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
            />

            <p className="text-[11px] text-slate-400">
              💡 <i>Tips: Seluruh jadwal laga dan tabel klasemen akan langsung disusun otomatis begitu turnamen dibuat.</i>
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>Buat Turnamen Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
