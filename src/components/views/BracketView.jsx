import React, { useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import confetti from 'canvas-confetti';
import {
  GitFork,
  Trophy,
  Share2,
  CheckCircle2,
  Flame,
  Shield,
  Layers,
  Sparkles,
  Users,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { generateDoubleElimWAText, generateSingleElimWAText } from '../../services/exportService';

export default function BracketView({ onNavigateToShare }) {
  const {
    activeTournament,
    standingsMap,
    updateKnockoutScore,
    updateDoubleElimScore,
    showToast
  } = useTournament();

  if (!activeTournament) return null;

  const mode = activeTournament.mode;
  const config = activeTournament.config || {};
  const isDoubleElim = config.playoffType === 'double_elim';
  const is2Legs = config.knockoutLegs === 2;

  const doubleElim = activeTournament.doubleElimination;
  const knockoutMatches = activeTournament.knockoutMatches || [];

  // Eliminated teams from League Stage
  const leagueStandings = standingsMap['Liga'] || [];
  const upperCount = config.playoffUpperCount || 2;
  const lowerCount = config.playoffLowerCount || (leagueStandings.length >= 6 ? 4 : 2);
  const totalQualifiers = upperCount + lowerCount;
  const eliminatedTeams = mode === 'league' ? leagueStandings.slice(totalQualifiers) : [];

  // Champion determination
  const champion = isDoubleElim ? doubleElim?.champion : knockoutMatches.find(m => m.id === 'FINAL')?.winner;

  // Trigger celebration confetti when champion is crowned
  useEffect(() => {
    if (champion && champion !== 'Menang SF1' && champion !== 'Juara Upper Bracket') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [champion]);

  const handleCopyBracketWA = () => {
    let text = '';
    if (isDoubleElim) {
      text = generateDoubleElimWAText(activeTournament, doubleElim);
    } else {
      text = generateSingleElimWAText(activeTournament, knockoutMatches);
    }
    navigator.clipboard.writeText(text);
    showToast('Bagan Playoff disalin! Siap dipaste ke WhatsApp.');
  };

  // Render a match card
  const renderMatchCard = (m, bracketType = 'single') => {
    if (!m) return null;

    const h1 = m.homeLeg1 !== null ? m.homeLeg1 : '';
    const a1 = m.awayLeg1 !== null ? m.awayLeg1 : '';
    const h2 = m.homeLeg2 !== null ? m.homeLeg2 : '';
    const a2 = m.awayLeg2 !== null ? m.awayLeg2 : '';
    const hp = m.homePen !== null ? m.homePen : '';
    const ap = m.awayPen !== null ? m.awayPen : '';

    let aggText = '';
    let showPenalties = false;

    if (is2Legs && h1 !== '' && a1 !== '' && h2 !== '' && a2 !== '') {
      const hAgg = parseInt(h1, 10) + parseInt(h2, 10);
      const aAgg = parseInt(a1, 10) + parseInt(a2, 10);
      aggText = `Agregat: ${hAgg} - ${aAgg}`;
      if (hAgg === aAgg) showPenalties = true;
    } else if (!is2Legs && h1 !== '' && a1 !== '' && parseInt(h1, 10) === parseInt(a1, 10)) {
      showPenalties = true;
    }

    const isFinal = m.id === 'FINAL' || m.id === 'GRAND_FINAL';
    const isPlayin = bracketType === 'playin';
    const isUpper = bracketType === 'upper';
    const isLower = bracketType === 'lower';

    const handleScoreChange = (field, val) => {
      if (bracketType === 'single') {
        updateKnockoutScore(m.id, field, val);
      } else {
        updateDoubleElimScore(m.id, field, val, bracketType);
      }
    };

    return (
      <div
        key={m.id}
        className={`bg-slate-900 border rounded-2xl p-4 shadow-xl space-y-3 transition-all ${
          isFinal
            ? 'border-amber-400/50 glow-gold bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20'
            : isPlayin
            ? 'border-amber-500/30 bg-slate-900/90'
            : isUpper
            ? 'border-emerald-500/30'
            : isLower
            ? 'border-amber-500/30'
            : 'border-slate-800'
        }`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                isFinal
                  ? 'bg-amber-400 text-slate-950'
                  : isPlayin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isUpper
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isLower
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {m.roundName}
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
              {m.matchLabel}
            </span>
          </div>

          {aggText && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
              {aggText}
            </span>
          )}
        </div>

        {/* Teams & Score Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          
          {/* Home Team Box */}
          <div
            className={`flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border transition ${
              m.winner === m.homeTeam && m.homeTeam && !m.homeTeam.includes('Menang') && !m.homeTeam.includes('Pemenang')
                ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                : 'border-slate-800/80'
            }`}
          >
            <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2 truncate flex-1 pr-2">
              {m.winner === m.homeTeam && m.homeTeam && !m.homeTeam.includes('Menang') && !m.homeTeam.includes('Pemenang') && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">{m.homeTeam}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                max="99"
                value={h1}
                onChange={(e) => handleScoreChange('h1', e.target.value)}
                placeholder={is2Legs ? 'L1' : 'Skor'}
                className="w-10 h-8 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-sm text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
              {is2Legs && (
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={h2}
                  onChange={(e) => handleScoreChange('h2', e.target.value)}
                  placeholder="L2"
                  className="w-10 h-8 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-sm text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              )}
            </div>
          </div>

          {/* Away Team Box */}
          <div
            className={`flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border transition ${
              m.winner === m.awayTeam && m.awayTeam && !m.awayTeam.includes('Menang') && !m.awayTeam.includes('Pemenang')
                ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                : 'border-slate-800/80'
            }`}
          >
            <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2 truncate flex-1 pr-2">
              {m.winner === m.awayTeam && m.awayTeam && !m.awayTeam.includes('Menang') && !m.awayTeam.includes('Pemenang') && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">{m.awayTeam}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min="0"
                max="99"
                value={a1}
                onChange={(e) => handleScoreChange('a1', e.target.value)}
                placeholder={is2Legs ? 'L1' : 'Skor'}
                className="w-10 h-8 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-sm text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
              {is2Legs && (
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={a2}
                  onChange={(e) => handleScoreChange('a2', e.target.value)}
                  placeholder="L2"
                  className="w-10 h-8 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-sm text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              )}
            </div>
          </div>

        </div>

        {/* Penalty Shootout Drawer */}
        {showPenalties && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs flex-wrap">
            <span className="text-amber-400 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Adu Penalti:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-bold truncate max-w-[100px]">{m.homeTeam}:</span>
              <input
                type="number"
                min="0"
                max="99"
                value={hp}
                onChange={(e) => handleScoreChange('hp', e.target.value)}
                placeholder="PK"
                className="w-9 h-7 bg-slate-950 border border-slate-700 rounded text-center font-black text-amber-400 focus:outline-none focus:border-amber-400"
              />
              <span className="text-slate-500 font-bold">vs</span>
              <span className="text-slate-300 font-bold truncate max-w-[100px]">{m.awayTeam}:</span>
              <input
                type="number"
                min="0"
                max="99"
                value={ap}
                onChange={(e) => handleScoreChange('ap', e.target.value)}
                placeholder="PK"
                className="w-9 h-7 bg-slate-950 border border-slate-700 rounded text-center font-black text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* View Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-amber-400" />
            <span>
              {isDoubleElim
                ? 'Babak Playoff Sistem MPL (Hybrid Double Elimination)'
                : 'Babak Gugur (Playoff Bracket)'}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            {isDoubleElim
              ? 'Seed 1 & 2 menunggu di Upper Bracket Semis. Tim Play-in bertanding sistem gugur, pemenang menantang Seed 1 & 2!'
              : 'Pemenang setiap laga otomatis melaju ke babak selanjutnya hingga Grand Final.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyBracketWA}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Bracket WA</span>
          </button>
        </div>
      </div>

      {/* Champion Celebration Card */}
      {champion && champion !== 'Menang SF1' && champion !== 'Juara Upper Bracket' && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden glow-gold">
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 inline-block">
              🏆 JUARA TURNAMEN eFOOTBALL 🏆
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white drop-shadow-md text-gradient-gold">
              {champion}
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-md mx-auto">
              Selamat atas gelar juara yang luar biasa!
            </p>
          </div>
        </div>
      )}

      {/* Bracket Content */}
      {isDoubleElim ? (
        /* MPL Style Double Elimination View */
        <div className="space-y-8">
          
          {/* Stage 1: Play-in Round (Sudden Death) */}
          {(doubleElim?.playInMatches || []).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                  <h3 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4" /> TAHAP 1: BABAK PLAY-IN (SUDDEN DEATH)
                  </h3>
                </div>
                <span className="text-[11px] text-amber-300 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                  Kalah = Langsung Gugur • Pemenang = Maju ke Upper Semis
                </span>
              </div>

              <div className="space-y-3">
                {doubleElim.playInMatches.map(m => renderMatchCard(m, 'playin'))}
              </div>
            </div>
          )}

          {/* Stage 2: Upper Bracket Semi Finals & Final */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <h3 className="text-base font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4" /> TAHAP 2: UPPER BRACKET (2 NYAWA)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                Peringkat 1 & 2 Menunggu • Kalah = Turun ke Lower Bracket
              </span>
            </div>

            <div className="space-y-3">
              {(doubleElim?.upperMatches || []).map(m => renderMatchCard(m, 'upper'))}
            </div>
          </div>

          {/* Stage 3: Lower Bracket */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <h3 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4" /> TAHAP 3: LOWER BRACKET (PENENTUAN GRAND FINAL)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">
                Tim yang kalah dari Upper Bracket bertarung memperebutkan tiket Grand Final
              </span>
            </div>

            <div className="space-y-3">
              {(doubleElim?.lowerMatches || []).map(m => renderMatchCard(m, 'lower'))}
            </div>
          </div>

          {/* Stage 4: Grand Final Section */}
          {doubleElim?.grandFinal && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-amber-300 uppercase tracking-wider">
                  👑 GRAND FINAL (PEREBUTAN JUARA 1 TURNAMEN)
                </h3>
              </div>

              {renderMatchCard(doubleElim.grandFinal, 'grand_final')}
            </div>
          )}

          {/* Eliminated Teams Section (Non-Playoff) */}
          {eliminatedTeams.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase text-red-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Tim Tereliminasi dari Babak Liga ({eliminatedTeams.length} Tim)
                </span>
                <span className="text-[11px] text-slate-400">
                  Peringkat {totalQualifiers + 1} s/d {leagueStandings.length} Klasemen Liga (Tidak Lolos Playoff)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {eliminatedTeams.map(t => (
                  <span
                    key={t.name}
                    className="px-3 py-1.5 bg-slate-950 border border-red-500/30 text-slate-300 text-xs rounded-xl font-bold flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-md bg-red-500/10 text-red-400 inline-flex items-center justify-center text-[10px]">
                      {t.rank}
                    </span>
                    <span>{t.name}</span>
                    <span className="text-slate-500 text-[10px]">({t.pts} PTS)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Single Elimination View */
        <div className="space-y-4">
          {knockoutMatches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic bg-slate-900 rounded-2xl border border-slate-800">
              Belum ada pertandingan babak gugur yang digenerate.
            </div>
          ) : (
            <div className="space-y-4">
              {knockoutMatches.map(m => renderMatchCard(m, 'single'))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
