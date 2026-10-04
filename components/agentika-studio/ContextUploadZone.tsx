import React, { useRef } from 'react';
import { Paperclip, UploadCloud } from 'lucide-react';
import { parseDocumentFile } from '../../utils/documentParser';
import { AttachedDocument } from '../../types';
import { toast } from '../../utils/toast';

interface ContextUploadZoneProps {
  onFilesProcessed: (files: AttachedDocument[]) => void;
  className?: string;
}

export const ContextUploadZone: React.FC<ContextUploadZoneProps> = ({
  onFilesProcessed,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const processed: AttachedDocument[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        toast.info(`Mengekstraksi berkas ${file.name}...`);
        const doc = await parseDocumentFile(file);
        processed.push(doc);
        toast.success(`Berkas ${file.name} berhasil disematkan!`);
      } catch (err: any) {
        toast.error(`Gagal membaca ${file.name}: ${err.message || 'Format tidak didukung'}`);
      }
    }

    if (processed.length > 0) {
      onFilesProcessed(processed);
    }
  };

  return (
    <div className={`context-upload-zone ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png,.webm,.mp3,.m4a,.wav"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
        title="Lampirkan berkas referensi (PDF, DOCX, XLSX, Gambar, Audio)"
      >
        <Paperclip size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
};

export default ContextUploadZone;
