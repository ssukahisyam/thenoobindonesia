import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Share2,
  Download,
  Copy,
  CheckCircle2,
  Trophy,
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import {
  generateStandingsWAText,
  generateDoubleElimWAText,
  generateSingleElimWAText,
  exportElementAsImage
} from '../../services/exportService';

export default function ShareStudioView() {
  const {
    activeTournament,
    standingsMap,
    showToast
  } = useTournament();

  const [isExporting, setIsExporting] = useState(false);

  if (!activeTournament) return null;

  const isDoubleElim = activeTournament.config?.playoffType === 'double_elim';
  const doubleElim = activeTournament.doubleElimination;
  const knockoutMatches = activeTournament.knockoutMatches || [];

  const handleCopyStandings = () => {
    const text = generateStandingsWAText(activeTournament, standingsMap);
    navigator.clipboard.writeText(text);
    showToast('Teks Klasemen disalin ke clipboard!');
  };

  const handleCopyBracket = () => {
    const text = isDoubleElim
      ? generateDoubleElimWAText(activeTournament, doubleElim)
      : generateSingleElimWAText(activeTournament, knockoutMatches);
    navigator.clipboard.writeText(text);
    showToast('Teks Bagan Playoff disalin ke clipboard!');
  };

  const handleDownloadPoster = async () => {
    setIsExporting(true);
    showToast('Menghasilkan poster HD...');
    const filename = `${activeTournament.name.toLowerCase().replace(/\s+/g, '_')}_poster.png`;
    const ok = await exportElementAsImage('posterCanvasCard', filename);
    setIsExporting(false);
    if (ok) {
      showToast('Poster gambar HD berhasil diunduh!');
    } else {
      showToast('Gagal membuat gambar poster.', 'warning');
    }
  };

  // Champion
  const champion = isDoubleElim ? doubleElim?.champion : knockoutMatches.find(m => m.id === 'FINAL')?.winner;

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <span>Share Studio & Generator Poster HD</span>
          </h2>
          <p className="text-xs text-slate-400">
            Salin rekap turnamen untuk WhatsApp atau unduh poster grafik resolusi tinggi untuk media sosial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: WhatsApp Templates */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Format Pesan WhatsApp Siap Salin</span>
            </h3>

            {/* WA Box 1: Standings */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">📊 Rekap Klasemen Turnamen</span>
                <button
                  onClick={handleCopyStandings}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin WA</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Menyusun tabel klasemen, poin, selisih gol, dan status lolos Upper/Lower bracket.
              </p>
            </div>

            {/* WA Box 2: Playoff Bracket */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">🔥 Rekap Babak Playoff</span>
                <button
                  onClick={handleCopyBracket}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin WA</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Menyusun bagan Upper Bracket, Lower Bracket, Grand Final, dan pemenang.
              </p>
            </div>

          </div>

          {/* Export Action Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Ekspor Gambar Poster HD</span>
            </h3>
            <p className="text-xs text-slate-400">
              Poster di samping akan digenerate otomatis menjadi file gambar PNG kualitas tinggi siap upload ke WhatsApp Status / Instagram Story.
            </p>
            <button
              disabled={isExporting}
              onClick={handleDownloadPoster}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses Poster...' : 'Download Poster Gambar (PNG HD)'}</span>
            </button>
          </div>

        </div>

        {/* Right Column: Visual Poster Card Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          <span className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Live Preview Kartu Poster
          </span>

          {/* The Poster Element to Capture */}
          <div
            id="posterCanvasCard"
            className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 glow-green"
          >
            {/* Poster Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-display uppercase tracking-wider text-xl sm:text-2xl font-black text-white leading-none">
                    {activeTournament.name}
                  </h1>
                  <p className="text-[11px] text-emerald-400 font-bold mt-0.5">
                    eFootball Official Tournament
                  </p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                v2 PRO
              </span>
            </div>

            {/* Champion Banner if present */}
            {champion && champion !== 'Menang SF1' && champion !== 'Juara Upper Bracket' && (
              <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-3.5 text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-amber-400">🏆 JUARA 1 TURNAMEN 🏆</p>
                <p className="text-xl font-black text-white text-gradient-gold">{champion}</p>
              </div>
            )}

            {/* Poster Standings Snapshot */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                KLASEMEN SEMENTARA
              </p>

              {Object.keys(standingsMap).map(gKey => {
                const list = standingsMap[gKey] || [];
                return (
                  <div key={gKey} className="bg-slate-950/90 rounded-2xl border border-slate-800/80 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-900/60 text-[9px] text-slate-400 uppercase font-black border-b border-slate-800">
                          <th className="py-2 px-2.5 text-center w-8">#</th>
                          <th className="py-2 px-2">Tim</th>
                          <th className="py-2 px-2 text-center">P</th>
                          <th className="py-2 px-2 text-center">GD</th>
                          <th className="py-2 px-2.5 text-center text-emerald-400">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 font-bold">
                        {list.slice(0, 6).map((item, idx) => (
                          <tr key={item.name} className="hover:bg-slate-800/30">
                            <td className="py-2 px-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-2 text-white truncate max-w-[130px]">{item.name}</td>
                            <td className="py-2 px-2 text-center text-slate-400">{item.p}</td>
                            <td className={`py-2 px-2 text-center ${item.gd > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {item.gd > 0 ? `+${item.gd}` : item.gd}
                            </td>
                            <td className="py-2 px-2.5 text-center text-emerald-400 font-black">{item.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Poster Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>📅 {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
              <span className="text-emerald-400 font-bold">eFootball Manager</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
