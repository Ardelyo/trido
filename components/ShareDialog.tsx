import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2, Share2, GlobeLock } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string; // the generated room ID
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/?room=${roomId}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <h3 className="text-[16px] font-extrabold text-slate-800">Bagikan Papan Tulis</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/50 text-slate-500 transition-colors">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 flex items-center justify-center mx-auto mb-2 text-blue-600 shadow-inner relative">
                <GlobeLock size={32} />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" 
                />
              </div>
              
              <div className="text-center">
                <div className="text-[17px] font-extrabold text-slate-900 mb-1">Sesi Sinkronisasi Aktif</div>
                <div className="text-[13px] text-slate-500 font-medium px-2 leading-relaxed">
                  Bagikan tautan unik ini. Audiens dapat melihat pergerakan layar dan papan tulis Anda secara langsung.
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[11px] uppercase tracking-wider font-bold text-slate-400 px-1">
                  <span>ID Sesi</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                  </span>
                </div>
                <div className="text-[18px] font-mono font-bold text-slate-700 tracking-widest text-center py-1 bg-white rounded-xl border border-slate-200/50 shadow-sm">
                  {roomId}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-1">Tautan Berbagi</div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-[1.25rem] border border-slate-200">
                   <input 
                     type="text" 
                     value={shareUrl} 
                     readOnly 
                     className="flex-1 bg-transparent border-none outline-none text-[13px] font-semibold text-slate-600 px-3 truncate"
                   />
                   <button 
                     onClick={handleCopy}
                     className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-white shrink-0 shadow-sm active:scale-95 ${copied ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                   >
                     {copied ? (
                       <><CheckCircle2 size={16} /> <span>Tersalin</span></>
                     ) : (
                       <><Copy size={16} /> <span>Salin</span></>
                     )}
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
