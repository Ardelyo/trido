import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Download, Image as ImageIcon, FileJson } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../utils/translations';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<any>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, canvasRef }) => {
  const { t } = useTranslation();
  
  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Deselect before generating PNG
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 2 // High quality
    });
    
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `trido_board_${new Date().getTime()}.png`;
    a.click();
    onClose();
  };
  
  const handleExportJSON = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const json = canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']);
    const domBase = useStore.getState().domElements;
    const exportData = {
        canvas: json,
        dom: domBase
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `trido_board_${new Date().getTime()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-slate-200/60 z-[101] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[16px] font-extrabold text-slate-800">
                {t('export', 'Ekspor')} {t('whiteboard', 'Papan Tulis')}
              </h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/50 text-slate-500 transition-colors">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-3">
              <button 
                onClick={handleExportPNG}
                className="flex items-center gap-4 px-4 py-4 bg-white hover:bg-blue-50 border-[1.5px] border-slate-200 hover:border-blue-400 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-[1.2rem] bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-[15px]">{t('saveAsPng', 'Simpan sebagai PNG')}</div>
                  <div className="text-[13px] text-slate-500 font-medium">{t('highQualityImage', 'Gambar kualitas tinggi')}</div>
                </div>
              </button>

              <button 
                onClick={handleExportJSON}
                className="flex items-center gap-4 px-4 py-4 bg-white hover:bg-emerald-50 border-[1.5px] border-slate-200 hover:border-emerald-400 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileJson size={24} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-[15px]">{t('saveAsJson', 'Simpan sebagai JSON')}</div>
                  <div className="text-[13px] text-slate-500 font-medium">{t('editableLater', 'Data bisa diedit lagi nanti')}</div>
                </div>
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
