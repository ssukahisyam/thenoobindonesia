import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { X, ClipboardPaste } from 'lucide-react';

export default function BulkAddTeamsModal({ isOpen, onClose }) {
  const { bulkAddTeams } = useTournament();
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleProcess = () => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    bulkAddTeams(lines);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ClipboardPaste className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              Paste Banyak Peserta Sekaligus
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Masukkan 1 nama tim / player per baris. Jadwal pertandingan dan klasemen akan langsung otomatis digenerate untuk semua peserta.
        </p>

        <textarea
          rows="8"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hisyam&#10;Siraj&#10;Tegar&#10;Amin&#10;Ghossani&#10;Alwi&#10;Panuntun&#10;Alan&#10;Alim"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
          >
            Batal
          </button>
          <button
            onClick={handleProcess}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20"
          >
            Simpan Semua & Susun Jadwal
          </button>
        </div>
      </div>
    </div>
  );
}
