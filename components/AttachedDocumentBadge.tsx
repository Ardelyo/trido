import React from 'react';
import { useStore } from '../store';
import { X, FileText, FileSpreadsheet, Presentation, FileCode, File, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AttachedDocument } from '../types';

interface AttachedDocumentBadgeProps {
  className?: string;
  compact?: boolean;
}

export const AttachedDocumentBadge: React.FC<AttachedDocumentBadgeProps> = ({ className = '', compact = false }) => {
  const { attachedDocument, lastUploadedImage, setAttachedDocument, setLastUploadedImage } = useStore();

  if (!attachedDocument && !lastUploadedImage) return null;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachedDocument(null);
    setLastUploadedImage(null);
  };

  // Fallback for image-only legacy state
  const doc: AttachedDocument = attachedDocument || {
    name: 'gambar.png',
    type: 'image/png',
    size: 0,
    category: 'image',
    text: '[Gambar dilampirkan]',
    dataUrl: lastUploadedImage
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'pdf':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          badge: 'bg-rose-600 text-white',
          icon: <FileText size={compact ? 14 : 16} className="text-rose-600 shrink-0" />,
          label: 'PDF'
        };
      case 'spreadsheet':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          badge: 'bg-emerald-600 text-white',
          icon: <FileSpreadsheet size={compact ? 14 : 16} className="text-emerald-600 shrink-0" />,
          label: 'SHEET'
        };
      case 'presentation':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badge: 'bg-amber-600 text-white',
          icon: <Presentation size={compact ? 14 : 16} className="text-amber-600 shrink-0" />,
          label: 'PPT'
        };
      case 'code':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          badge: 'bg-indigo-600 text-white',
          icon: <FileCode size={compact ? 14 : 16} className="text-indigo-600 shrink-0" />,
          label: 'CODE'
        };
      case 'document':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          badge: 'bg-blue-600 text-white',
          icon: <FileText size={compact ? 14 : 16} className="text-blue-600 shrink-0" />,
          label: 'DOC'
        };
      case 'image':
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-700',
          badge: 'bg-sky-600 text-white',
          icon: <ImageIcon size={compact ? 14 : 16} className="text-sky-600 shrink-0" />,
          label: 'IMG'
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          badge: 'bg-slate-600 text-white',
          icon: <File size={compact ? 14 : 16} className="text-slate-600 shrink-0" />,
          label: 'FILE'
        };
    }
  };

  const theme = getCategoryTheme(doc.category);

  if (doc.category === 'image' && doc.dataUrl) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          className={`relative inline-flex items-center group ${className}`}
        >
          <div className="relative rounded-[0.85rem] overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200/60 bg-slate-100">
            <img
              src={doc.dataUrl}
              alt={doc.name}
              className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} object-cover`}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow-md active:scale-95 transition-transform"
            title="Hapus lampiran"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl border shadow-sm backdrop-blur-sm ${theme.bg} ${className}`}
      >
        {theme.icon}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${theme.badge}`}>
          {theme.label}
        </span>
        <span className={`font-medium truncate max-w-[130px] sm:max-w-[180px] ${compact ? 'text-[11px]' : 'text-xs'}`} title={doc.name}>
          {doc.name}
        </span>
        {doc.pageCount && doc.pageCount > 1 && (
          <span className="text-[10px] opacity-75 whitespace-nowrap">
            {doc.pageCount} hlm
          </span>
        )}
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 p-0.5 rounded-full hover:bg-black/10 text-current transition-colors active:scale-90 shrink-0"
          title="Hapus file"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
