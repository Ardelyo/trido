import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Search, Clock, Calendar, Trash2, Edit2, Share2, FileText, Download, ImageDown } from 'lucide-react';
import { useStore } from '../store';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from '../utils/toast';
import { BoardSession } from '../types';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
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
  const { sessions, loadSessions, loadSessionData, deleteSession } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<BoardSession | null>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filtered = sessions.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Download preview as PNG image
  const handleDownload = (item: BoardSession) => {
    const previewUrl = item.pages[0]?.previewDataUrl;

    if (!previewUrl || previewUrl.startsWith('http')) {
      // No canvas preview yet — guide user
      toast.info('Pratinjau belum tersedia. Buka sesi ini lalu simpan untuk menghasilkan pratinjau.');
      return;
    }

    // It's a base64 data URL — trigger download
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${item.title.replace(/[^a-zA-Z0-9\s]/g, '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Pratinjau "${item.title}" berhasil diunduh.`);
  };

  // Copy shareable URL to clipboard
  const handleShare = (item: BoardSession) => {
    const url = `${window.location.origin}${window.location.pathname}?session=${item.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Tautan sesi disalin! Bagikan ke peserta didik Anda.');
    }).catch(() => {
      // Fallback: show the URL in a toast
      toast.info(`Tautan: ${url}`);
    });
  };

  // Confirm then delete
  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteSession(confirmDelete.id);
    toast.success(`Sesi "${confirmDelete.title}" telah dihapus.`);
    setConfirmDelete(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-0 z-40 bg-zinc-50 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="h-24 px-8 lg:px-12 flex justify-between items-center bg-white border-b border-zinc-200 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              Riwayat Papan Tulis <Clock className="text-blue-500" size={24} />
            </h2>
            <p className="text-sm font-semibold text-zinc-500 mt-1">
              Akses kembali sesi papan tulis Anda sebelumnya.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Cari riwayat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-64 bg-zinc-50 border border-zinc-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-semibold text-zinc-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-zinc-400"
              />
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-sm"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 w-full max-w-7xl mx-auto custom-scrollbar">
          {/* Search Input for Mobile */}
          <div className="relative mb-8 md:hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Cari riwayat..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-full py-3.5 pl-12 pr-6 text-sm font-semibold text-zinc-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
                  className="group flex flex-col bg-white border border-zinc-200/80 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-zinc-100 relative overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold text-zinc-700 shadow-sm">
                      <FileText size={12} /> {item.pages.length} hlm
                    </div>

                    {/* Hover action buttons — visible always (not just on hover) for discoverability */}
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        title="Bagikan tautan sesi"
                        onClick={() => handleShare(item)}
                        className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-sm text-zinc-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm"
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        title="Hapus sesi"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(item); }}
                        className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-sm text-zinc-600 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-extrabold text-zinc-800 text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium mb-4">
                      <Calendar size={14} />
                      <span>{formatDate(item.updatedAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300" />
                      <span>{formatSize(item.sizeBytes || 0)}</span>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button
                        title="Unduh pratinjau sesi sebagai gambar PNG"
                        onClick={() => handleDownload(item)}
                        className="py-2.5 px-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-zinc-200"
                      >
                        <ImageDown size={16} /> Unduh
                      </button>
                      <button
                        onClick={() => {
                          loadSessionData(item.id);
                          onClose();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit2 size={16} /> Buka
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300 mb-6">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-700 mb-2">
                {searchQuery ? 'Sesi tidak ditemukan' : 'Belum ada sesi tersimpan'}
              </h3>
              <p className="text-zinc-500 font-medium">
                {searchQuery ? 'Coba gunakan nama yang berbeda.' : 'Klik Simpan di toolbar atas untuk menyimpan sesi pertama Anda.'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Hapus Sesi?"
        message={`Sesi "${confirmDelete?.title}" akan dihapus secara permanen dan tidak dapat dipulihkan.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        confirmVariant="danger"
      />
    </>
  );
};
