import React, { useState, useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { firebaseService } from '../../services/firebaseService';
import { storage } from '../../services/storageService';
import {
  History,
  X,
  Cloud,
  HardDrive,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  PlusCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function HistoryBackupModal({ isOpen, onClose }) {
  const { activeTournament, createManualBackup, restoreSnapshot, showToast } = useTournament();
  const [activeTab, setActiveTab] = useState('cloud'); // 'cloud' | 'local'
  const [cloudSnapshots, setCloudSnapshots] = useState([]);
  const [localSnapshots, setLocalSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [confirmRestoreSnap, setConfirmRestoreSnap] = useState(null);

  const loadSnapshots = async () => {
    if (!activeTournament) return;
    setLoading(true);

    try {
      // 1. Local Snapshots
      const locals = storage.getLocalSnapshots(activeTournament.id);
      setLocalSnapshots(locals);

      // 2. Cloud Snapshots from Firebase
      const clouds = await firebaseService.getCloudSnapshots(activeTournament.id);
      setCloudSnapshots(clouds);
    } catch (err) {
      console.error('Error loading snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, activeTournament]);

  if (!isOpen) return null;

  const handleCreateManual = async (e) => {
    e.preventDefault();
    const label = backupLabel.trim() || 'Manual Backup';
    await createManualBackup(label);
    setBackupLabel('');
    loadSnapshots();
  };

  const handleExecuteRestore = (snap) => {
    if (!snap || !snap.tournamentState) return;
    restoreSnapshot(snap.tournamentState);
    setConfirmRestoreSnap(null);
    onClose();
  };

  const snapshotsToDisplay = activeTab === 'cloud' ? cloudSnapshots : localSnapshots;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Riwayat Snapshot & Pemulihan Data
              </h3>
              <p className="text-[11px] text-slate-400">
                Pulihkan data turnamen ke versi waktu sebelumnya jika terjadi kesalahan/timpa data.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Manual Snapshot Box */}
        <form onSubmit={handleCreateManual} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={backupLabel}
            onChange={(e) => setBackupLabel(e.target.value)}
            placeholder="Beri label snapshot baru (contoh: Sebelum Babak 8 Besar)..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simpan Snapshot</span>
          </button>
        </form>

        {/* Tabs Switcher: Cloud vs Local */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cloud')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'cloud'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Snapshot Cloud Firebase ({cloudSnapshots.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('local')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'local'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Snapshot Browser Lokal ({localSnapshots.length})</span>
            </button>
          </div>

          <button
            onClick={loadSnapshots}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Snapshots List Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px]">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              Memuat daftar snapshot...
            </div>
          ) : snapshotsToDisplay.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <Clock className="w-7 h-7 mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">
                Belum ada snapshot tersimpan untuk turnamen ini.
              </p>
              <p className="text-[11px] text-slate-500">
                Snapshot akan otomatis dibuat setiap kali skor diinput atau Anda mengklik "Simpan Snapshot" di atas.
              </p>
            </div>
          ) : (
            snapshotsToDisplay.map((snap) => {
              const dateStr = new Date(snap.timestamp).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'medium'
              });

              return (
                <div
                  key={snap.key || snap.timestamp}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-white">
                        {snap.label || 'Auto Snapshot'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {snap.finishedCount} Laga Selesai
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmRestoreSnap(snap)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 shrink-0 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan Versi Ini</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmRestoreSnap && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">
                  Konfirmasi Pemulihan Data
                </h4>
                <p className="text-[11px] text-slate-300">
                  Apakah Anda yakin ingin memulihkan turnamen ke versi{' '}
                  <b>"{confirmRestoreSnap.label}"</b> ({confirmRestoreSnap.finishedCount} Laga Selesai) per tanggal{' '}
                  {new Date(confirmRestoreSnap.timestamp).toLocaleString('id-ID')}?
                </p>
                <p className="text-[10px] text-amber-300 mt-1">
                  💡 <i>Sistem akan otomatis menyimpan versi saat ini sebagai snapshot cadangan sebelum memulihkan.</i>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmRestoreSnap(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleExecuteRestore(confirmRestoreSnap)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                Ya, Pulihkan Sekarang
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
