import React from 'react';
import { FileText, Table, Image, Music, X } from 'lucide-react';
import { AttachedDocument } from '../../types';

interface ContextChipProps {
  document: AttachedDocument;
  onRemove: () => void;
}

export const ContextChip: React.FC<ContextChipProps> = ({ document, onRemove }) => {
  const getIcon = () => {
    if (document.type?.startsWith('audio') || /\.(mp3|wav|m4a|webm|ogg)$/i.test(document.name)) {
      return <Music size={13} className="text-[#F5C518]" />;
    }
    switch (document.category) {
      case 'spreadsheet': return <Table size={13} className="text-[#1D4ED8]" />;
      case 'image': return <Image size={13} className="text-[#1D4ED8]" />;
      default: return <FileText size={13} className="text-[#1D4ED8]" />;
    }
  };

  const sizeKb = (document.size / 1024).toFixed(0);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-full text-xs font-semibold text-slate-800 shadow-2xs">
      {getIcon()}
      <span className="max-w-[130px] truncate" title={document.name}>
        {document.name}
      </span>
      <span className="text-[10px] text-slate-400 font-mono">
        ({sizeKb}KB)
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
        title="Hapus lampiran"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default ContextChip;
