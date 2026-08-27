import React, { useState, useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { storage } from '../../services/storageService';
import {
  FolderOpen,
  PlusCircle,
  Copy,
  Trash2,
  Download,
  Upload,
  X,
  Calendar,
  Users,
  CheckCircle2,
  Layers
} from 'lucide-react';

export default function TournamentListModal({ isOpen, onClose, onOpenCreateModal }) {
  const { tournamentList, activeTournament, switchTournament, duplicateTournament, deleteTournament, showToast, createNewTournament } = useTournament();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportSingle = (id, name) => {
    const jsonStr = storage.exportTournamentJson(id);
    if (jsonStr) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.toLowerCase().replace(/\s+/g, '_')}_backup.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('File backup turnamen berhasil diunduh!');
    }
  };

  const handleExportAll = () => {
    const jsonStr = storage.exportAllJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_tournaments_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Semua database turnamen berhasil diekspor!');
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = storage.importTournamentJson(content);
        if (res.success) {
          showToast(`Berhasil mengimpor ${res.count} turnamen!`);
          window.location.reload();
        } else {
          showToast(`Gagal mengimpor file: ${res.error}`, 'warning');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Daftar Turnamen Saya (Save Slots)
              </h2>
              <p className="text-xs text-slate-400">
                Pilih, ganti, duplikasi, atau ekspor data turnamen lama kapan saja tanpa takut hilang.
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

        {/* Action Bar (Export/Import & New) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Turnamen Baru</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
              title="Backup Semua Turnamen ke File JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Backup Semua</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
              title="Impor Turnamen dari File JSON"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Impor Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Tournament List Scrollable Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {tournamentList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic space-y-2">
              <FolderOpen className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
              <p>Belum ada turnamen tersimpan.</p>
            </div>
          ) : (
            tournamentList.map((t) => {
              const isActive = activeTournament?.id === t.id;

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-slate-800/90 border-emerald-500/50 glow-green'
                      : 'bg-slate-950/60 border-slate-800/90 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  {/* Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-white truncate">
                        {t.name}
                      </h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> AKTIF SEKARANG
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {t.mode === 'league' ? 'Liga' : t.mode === 'cup' ? 'Cup' : 'Knockout'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {t.teamCount} Peserta
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(t.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    {!isActive ? (
                      <button
                        onClick={() => {
                          switchTournament(t.id);
                          onClose();
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition"
                      >
                        Buka Turnamen
                      </button>
                    ) : (
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
                      >
                        Sedang Dibuka
                      </button>
                    )}

                    {/* Clone */}
                    <button
                      onClick={() => duplicateTournament(t.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700"
                      title="Duplikasi Turnamen"
                    >
                      <Copy className="w-4 h-4 text-amber-400" />
                    </button>

                    {/* Export */}
                    <button
                      onClick={() => handleExportSingle(t.id, t.name)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700"
                      title="Download Backup JSON"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                    </button>

                    {/* Delete */}
                    {deleteConfirmId === t.id ? (
                      <div className="flex items-center gap-1.5 bg-red-950/80 p-1 rounded-xl border border-red-500/40">
                        <button
                          onClick={() => {
                            deleteTournament(t.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg"
                        >
                          Hapus!
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(t.id)}
                        className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl transition border border-slate-700"
                        title="Hapus Turnamen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
