import React, { useState } from 'react';
import { firebaseService, DEFAULT_FIREBASE_CONFIG } from '../../services/firebaseService';
import { useTournament } from '../../context/TournamentContext';
import {
  Cloud,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function CloudSyncModal({ isOpen, onClose }) {
  const { cloudStatus, showToast, activeTournament } = useTournament();
  const [configText, setConfigText] = useState(() => JSON.stringify(firebaseService.getConfig(), null, 2));

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(configText);
      const success = firebaseService.saveConfig(parsed);
      if (success) {
        showToast('Konfigurasi Firebase diperbarui! Menghubungkan ulang...');
        onClose();
      } else {
        showToast('Gagal menyimpan konfigurasi Firebase.', 'warning');
      }
    } catch (err) {
      showToast('Format JSON tidak valid!', 'warning');
    }
  };

  const handleReset = () => {
    firebaseService.resetToDefaultConfig();
    setConfigText(JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
    showToast('Konfigurasi direset ke default project the-noob-indonesia.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Firebase Realtime Database
              </h3>
              <p className="text-[11px] text-slate-400">
                Sinkronisasi multi-perangkat dan live spectator
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

        {/* Live Status Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Database className="w-5 h-5 text-slate-300" />
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                  cloudStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : cloudStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-red-400'
                }`}
              />
            </div>
            <div>
              <span className="text-xs font-black text-white block">
                {cloudStatus === 'connected'
                  ? 'Terhubung (the-noob-indonesia)'
                  : cloudStatus === 'connecting'
                  ? 'Menghubungkan...'
                  : 'Mode Offline (LocalStorage)'}
              </span>
              <span className="text-[10px] text-slate-400">
                Path: /tournaments/{activeTournament ? activeTournament.id : '...'}
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Realtime Active
          </span>
        </div>

        {/* Config JSON Area */}
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              Konfigurasi Firebase (JSON):
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Reset ke Default
            </button>
          </div>

          <textarea
            rows="6"
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-400"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Simpan & Hubungkan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
