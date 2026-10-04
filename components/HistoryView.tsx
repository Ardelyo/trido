import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Clock, Calendar, Trash2, Edit2, Share2, 
  FileText, Download, ImageDown, Copy, Check, Plus, 
  Layers, HardDrive, Sparkles, FolderUp, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { useStore } from '../store';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from '../utils/toast';
import { BoardSession } from '../types';
import { downloadFile } from '../utils/smartExport';

const formatSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

interface HistoryViewProps {
  onClose: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onClose }) => {
  const { 
    sessions, currentSessionId, loadSessions, 
    loadSessionData, deleteSession, saveCurrentSession,
    createNewSession 
  } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<BoardSession | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitleValue, setNewTitleValue] = useState('');
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filtered = sessions.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Direct download of project file (.trido) from history
  const handleExportProjectFile = (item: BoardSession) => {
    const exportData = {
      app: 'trido',
      version: '1.0.0',
      exportedAt: Date.now(),
      title: item.title,
      pages: item.pages,
      currentPageIndex: 0,
      messages: item.messages || [],
      lessonPlan: item.lessonPlan || null
    };

    const safeName = (item.title || 'papan').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    downloadFile(JSON.stringify(exportData, null, 2), `${safeName}_${Date.now()}.trido.json`, 'application/json');
    toast.success(`Berkas cadangan "${item.title}" berhasil diunduh!`);
  };

  // Duplicate an existing session
  const handleDuplicateSession = async (item: BoardSession) => {
    const newId = Date.now().toString();
    const duplicated: BoardSession = {
      ...item,
      id: newId,
      title: `${item.title} (Salinan)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const { saveSessionToDb } = await import('../services/db');
    await saveSessionToDb(duplicated);
    await loadSessions();
    toast.success(`Sesi "${item.title}" berhasil diduplikasi!`);
  };

  // Inline Rename
  const handleSaveRename = async (item: BoardSession) => {
    if (!newTitleValue.trim() || newTitleValue === item.title) {
      setEditingTitleId(null);
      return;
    }

    const updated: BoardSession = {
      ...item,
      title: newTitleValue.trim(),
      updatedAt: Date.now()
    };

    const { saveSessionToDb } = await import('../services/db');
    await saveSessionToDb(updated);
    await loadSessions();
    setEditingTitleId(null);
    toast.success('Nama papan berhasil diubah!');
  };

  // Download preview as PNG image
  const handleDownloadPreview = (item: BoardSession) => {
    const previewUrl = item.pages[0]?.previewDataUrl;

    if (!previewUrl || previewUrl.startsWith('http')) {
      toast.info('Pratinjau gambar belum tersedia. Buka sesi ini lalu simpan untuk menghasilkan gambar.');
      return;
    }

    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${item.title.replace(/[^a-zA-Z0-9\s]/g, '') || 'papan'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Pratinjau "${item.title}" berhasil diunduh.`);
  };

  // Confirm then delete
  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteSession(confirmDelete.id);
    toast.success(`Sesi "${confirmDelete.title}" telah dihapus.`);
    setConfirmDelete(null);
  };

  // Quick Snapshot Active Board Now
  const handleSaveActiveNow = async () => {
    await saveCurrentSession();
    await loadSessions();
    toast.success('Status papan saat ini telah dicadangkan ke riwayat.');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-40 bg-[#f8f7f5] overflow-hidden flex flex-col font-sans"
      >
        {/* Header */}
        <div className="h-20 px-6 lg:px-12 flex justify-between items-center bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1550aa] flex items-center justify-center text-white shadow-2xs">
              <Clock size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#0a1a3a] tracking-tight">
                  Riwayat Papan Tulis Lokal
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {sessions.length} Sesi
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tersimpan di memori laptop (IndexedDB) • Akses tanpa kuota internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Cari riwayat papan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/80 border border-slate-200 rounded-full py-1.5 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-hidden focus:bg-white focus:border-[#1550aa] transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Action: Save Current Board */}
            <button
              type="button"
              onClick={handleSaveActiveNow}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#1550aa] hover:bg-[#0a1a3a] text-white text-xs font-bold rounded-full transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Simpan Papan Aktif</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Tutup riwayat"
            >
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 w-full max-w-7xl mx-auto custom-scrollbar space-y-4">
          
          {/* Mobile Search */}
          <div className="relative sm:hidden">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari riwayat papan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-full py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-hidden"
            />
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((item, idx) => {
                const isActiveSession = currentSessionId === item.id;
                const hasValidPreview = item.pages[0]?.previewDataUrl && item.pages[0]?.previewDataUrl.startsWith('data:image');

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className={`group flex flex-col bg-white border rounded-2xl overflow-hidden transition-all shadow-2xs hover:shadow-md ${
                      isActiveSession 
                        ? 'border-[#1550aa] ring-2 ring-[#1550aa]/15' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Visual Thumbnail */}
                    <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center p-2 border-b border-slate-100">
                      {hasValidPreview ? (
                        <img
                          src={item.pages[0].previewDataUrl}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain rounded transition-transform group-hover:scale-102 duration-300"
                        />
                      ) : (
                        <div className="text-center space-y-1 text-slate-400 select-none">
                          <Layers size={28} className="mx-auto opacity-40 text-[#1550aa]" />
                          <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-400">
                            Papan Pelajaran
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                          {item.pages.length} Hlm
                        </span>
                        {isActiveSession && (
                          <span className="bg-[#1550aa] text-white px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase shadow-2xs">
                            Aktif
                          </span>
                        )}
                      </div>

                      {/* Quick Card Top Actions */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="Duplikasi sesi papan"
                          onClick={() => handleDuplicateSession(item)}
                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-[#1550aa] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          title="Unduh berkas cadangan (.trido)"
                          onClick={() => handleExportProjectFile(item)}
                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-[#1550aa] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          title="Hapus sesi"
                          onClick={() => setConfirmDelete(item)}
                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-600 hover:text-rose-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Card Info & Inline Edit */}
                    <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                      <div>
                        {editingTitleId === item.id ? (
                          <div className="flex items-center gap-1.5 mb-1">
                            <input
                              type="text"
                              autoFocus
                              value={newTitleValue}
                              onChange={e => setNewTitleValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename(item);
                                if (e.key === 'Escape') setEditingTitleId(null);
                              }}
                              className="flex-1 text-xs font-bold border border-[#1550aa] rounded px-2 py-1 outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(item)}
                              className="px-2 py-1 bg-[#1550aa] text-white text-[10px] font-bold rounded cursor-pointer"
                            >
                              Simpan
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 
                              onDoubleClick={() => {
                                setEditingTitleId(item.id);
                                setNewTitleValue(item.title);
                              }}
                              className="font-extrabold text-sm text-[#0a1a3a] leading-tight line-clamp-1 cursor-pointer hover:text-[#1550aa] transition-colors"
                              title="Klik ganda untuk mengubah nama"
                            >
                              {item.title}
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTitleId(item.id);
                                setNewTitleValue(item.title);
                              }}
                              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              title="Ubah nama papan"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                          <span>{formatDate(item.updatedAt)}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="font-mono">{formatSize(item.sizeBytes || 0)}</span>
                        </div>
                      </div>

                      {/* Primary Action Button: Buka di Papan */}
                      <button
                        type="button"
                        onClick={() => {
                          loadSessionData(item.id);
                          toast.success(`Memuat sesi "${item.title}"`);
                          onClose();
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isActiveSession 
                            ? 'bg-blue-50 text-[#1550aa] border border-blue-200' 
                            : 'bg-[#1550aa] hover:bg-[#0a1a3a] text-white shadow-2xs'
                        }`}
                      >
                        <CornerDownLeft size={13} />
                        <span>{isActiveSession ? 'Kembali ke Papan Aktif' : 'Buka di Papan Tulis'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-80 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mx-auto">
                <Search size={28} />
              </div>
              <h3 className="text-base font-extrabold text-[#0a1a3a]">
                {searchQuery ? 'Tidak ada sesi yang cocok' : 'Belum ada sesi tersimpan'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery 
                  ? 'Coba gunakan kata kunci pencarian yang berbeda.' 
                  : 'Klik tombol Simpan di pojok kanan atas atau gunakan shortcut Ctrl+S untuk mencadangkan materi pelajaran.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span className="font-medium">
            Database Lokal: <strong>IndexedDB Browser (Tanpa Batas Kuota)</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-full transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Hapus Sesi Papan Tulis?"
        message={`Sesi "${confirmDelete?.title}" akan dihapus dari penyimpanan laptop dan tidak dapat dipulihkan.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmLabel="Ya, Hapus Sesi"
        cancelLabel="Batal"
        confirmVariant="danger"
      />
    </>
  );
};

export default HistoryView;
