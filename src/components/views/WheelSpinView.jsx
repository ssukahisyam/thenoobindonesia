import React, { useState, useEffect, useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { sound } from '../../services/soundService';
import confetti from 'canvas-confetti';
import {
  Dices,
  RotateCcw,
  Play,
  ListOrdered,
  CheckCircle,
  Table,
  X,
  Sparkles
} from 'lucide-react';

const SEGMENT_COLORS = [
  '#0052cc', '#00ff66', '#7928ca', '#ffd700',
  '#ff3366', '#00f2fe', '#f7b731', '#26de81',
  '#a55eea', '#ff5252', '#10ac84', '#2e86de'
];

export default function WheelSpinView({ onNavigateToStandings }) {
  const {
    activeTournament,
    setTeamGroup,
    saveActiveTournament,
    showToast
  } = useTournament();

  const canvasRef = useRef(null);

  const [remainingTeams, setRemainingTeams] = useState([]);
  const [currentTargetGroupIdx, setCurrentTargetGroupIdx] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState(null);

  if (!activeTournament) return null;

  const mode = activeTournament.mode;
  const isCup = mode === 'cup';
  const groupKeys = Object.keys(activeTournament.groups || {});
  const targetGroupName = groupKeys[currentTargetGroupIdx % (groupKeys.length || 1)] || 'Liga';

  // Initialize remaining teams
  useEffect(() => {
    if (activeTournament.wheelRemainingTeams && activeTournament.wheelRemainingTeams.length > 0) {
      setRemainingTeams(activeTournament.wheelRemainingTeams);
    } else {
      setRemainingTeams(activeTournament.teams.map(t => t.name));
    }
  }, [activeTournament]);

  // Draw the Wheel on Canvas
  const drawWheel = (angleOffset = currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;

    ctx.clearRect(0, 0, width, height);
    const numSegments = remainingTeams.length;

    if (numSegments === 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#1f293d';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#00ff66';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SEMUA PESERTA SUDAH TERUNDI! 🎉', centerX, centerY);
      ctx.restore();
      return;
    }

    const arcAngle = (2 * Math.PI) / numSegments;
    for (let i = 0; i < numSegments; i++) {
      const angle = angleOffset + i * arcAngle;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcAngle);
      ctx.closePath();

      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#080c14';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;

      const label = remainingTeams[i].length > 18 ? remainingTeams[i].substring(0, 16) + '..' : remainingTeams[i];
      ctx.fillText(label, radius - 20, 4);
      ctx.restore();
    }

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#080c14';
    ctx.fill();
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽', centerX, centerY);
  };

  useEffect(() => {
    drawWheel();
  }, [remainingTeams, currentAngle]);

  // Spin Action
  const spinWheel = () => {
    if (isSpinning || remainingTeams.length === 0) return;

    setIsSpinning(true);
    setSelectedWinner(null);

    const numSegments = remainingTeams.length;
    const arcAngle = (2 * Math.PI) / numSegments;
    const randomRotations = Math.floor(Math.random() * 360) + 1800; // 5+ full turns
    const duration = 4500;
    const startAngle = currentAngle;
    const targetAngle = startAngle + (randomRotations * Math.PI) / 180;

    let startTime = null;
    let lastSegment = -1;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;

      if (progress < 1) {
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const nextAngle = startAngle + (targetAngle - startAngle) * easeOut;
        setCurrentAngle(nextAngle);
        drawWheel(nextAngle);

        // Sound ticker on slice passing
        const normalized = (nextAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const segment = Math.floor((2 * Math.PI - normalized) / arcAngle) % numSegments;
        if (segment !== lastSegment) {
          sound.playTicker();
          lastSegment = segment;
        }

        requestAnimationFrame(animate);
      } else {
        setCurrentAngle(targetAngle);
        drawWheel(targetAngle);
        setIsSpinning(false);

        // Calculate Winner
        const finalNormalized = (targetAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        let pointerAngle = (1.5 * Math.PI - finalNormalized) % (2 * Math.PI);
        if (pointerAngle < 0) pointerAngle += 2 * Math.PI;

        const winIndex = Math.floor(pointerAngle / arcAngle) % numSegments;
        const winner = remainingTeams[winIndex];

        handleWinnerChosen(winner, winIndex);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleWinnerChosen = (winner, index) => {
    sound.playWin();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 }
    });

    setSelectedWinner(winner);

    // Remove from remaining queue
    const updatedQueue = remainingTeams.filter((_, i) => i !== index);
    setRemainingTeams(updatedQueue);

    // Assign to Target Group
    if (isCup && groupKeys.length > 0) {
      setTeamGroup(winner, targetGroupName);
      setCurrentTargetGroupIdx((prev) => (prev + 1) % groupKeys.length);
    }

    const updated = {
      ...activeTournament,
      wheelRemainingTeams: updatedQueue
    };
    saveActiveTournament(updated);

    showToast(`'${winner}' berhasil terpilih ${isCup ? `ke Grup ${targetGroupName}!` : '!'}`);
  };

  const resetQueue = () => {
    const all = activeTournament.teams.map(t => t.name);
    setRemainingTeams(all);
    setSelectedWinner(null);
    setCurrentTargetGroupIdx(0);

    const updated = {
      ...activeTournament,
      wheelRemainingTeams: all
    };
    saveActiveTournament(updated);
    showToast('Antrean spin wheel direset ke daftar awal peserta!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Dices className="w-5 h-5 text-amber-400" />
            <span>Undian Fair-Play Wheel Spin</span>
          </h2>
          <p className="text-xs text-slate-400">
            Putar roda spin untuk mengundi pembagian grup secara adil dan transparan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetQueue}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Roda</span>
          </button>
          <button
            onClick={onNavigateToStandings}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Lihat Klasemen</span>
          </button>
        </div>
      </div>

      {/* Main Wheel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Canvas Wheel */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
          
          {/* Target Group Badge (For Cup mode) */}
          {isCup && groupKeys.length > 0 && (
            <div className="w-full mb-4 flex items-center justify-between bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Target Masuk:</span>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-black text-xs rounded-xl border border-amber-500/30">
                  GRUP {targetGroupName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-400">Pilih Manual:</label>
                <select
                  value={targetGroupName}
                  onChange={(e) => {
                    const idx = groupKeys.indexOf(e.target.value);
                    if (idx !== -1) setCurrentTargetGroupIdx(idx);
                  }}
                  className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400"
                >
                  {groupKeys.map(g => (
                    <option key={g} value={g}>Grup {g}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Canvas Box with Red Pointer */}
          <div className="relative flex items-center justify-center my-3">
            <div className="absolute -top-3.5 z-20 text-red-500 filter drop-shadow-[0_4px_8px_rgba(239,68,68,0.7)]">
              <span className="text-3xl">🔻</span>
            </div>
            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="rounded-full shadow-2xl border-4 border-slate-800 max-w-full h-auto"
            />
          </div>

          {/* Spin Trigger Button */}
          <button
            disabled={isSpinning || remainingTeams.length === 0}
            onClick={spinWheel}
            className={`mt-6 w-full max-w-xs py-4 rounded-2xl text-slate-950 font-black text-base tracking-wider uppercase transition shadow-xl flex items-center justify-center gap-2 transform active:scale-95 ${
              isSpinning || remainingTeams.length === 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 shadow-amber-500/25'
            }`}
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>{isSpinning ? 'MEMUTAR RODA...' : 'SPIN RODA SEKARANG'}</span>
          </button>

          {/* Winner Notification Card */}
          {selectedWinner && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center animate-bounce-short">
              <p className="text-xs text-emerald-400 font-extrabold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Terpilih: <b>{selectedWinner}</b>
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Queue & Group Allocation */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Remaining in Wheel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-blue-400" />
                <span>Sisa Peserta di Roda ({remainingTeams.length})</span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-950/70 rounded-2xl border border-slate-800">
              {remainingTeams.length === 0 ? (
                <span className="text-slate-500 text-xs italic m-auto py-2">
                  Semua peserta telah terpilih!
                </span>
              ) : (
                remainingTeams.map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl truncate"
                  >
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Live Group Allocation */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Hasil Alokasi Grup</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {groupKeys.map(gKey => {
                const list = activeTournament.groups[gKey] || [];

                return (
                  <div
                    key={gKey}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        {isCup ? `GRUP ${gKey}` : gKey}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {list.length} Tim
                      </span>
                    </div>

                    <div className="space-y-1">
                      {list.length > 0 ? (
                        list.map((item, idx) => (
                          <div
                            key={item}
                            className="flex items-center justify-between text-xs p-1.5 bg-slate-900 rounded-xl text-slate-200 font-bold border border-slate-800"
                          >
                            <span className="truncate">{idx + 1}. {item}</span>
                            <button
                              onClick={() => {
                                setTeamGroup(item, 'NONE');
                                if (!remainingTeams.includes(item)) {
                                  setRemainingTeams([...remainingTeams, item]);
                                }
                              }}
                              className="text-slate-500 hover:text-red-400 p-0.5"
                              title="Keluarkan ke antrean roda"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500 italic p-1">
                          Belum ada peserta...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
