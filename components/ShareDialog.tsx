import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2, Share2, Globe, Wifi, QrCode, Smartphone, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../utils/translations';
import { toast } from '../utils/toast';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

interface NetworkInfo {
  primaryIp: string;
  addresses: string[];
  port: number;
  primaryUrl: string;
  hostname: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, roomId }) => {
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'qr' | 'link'>('qr');

  useEffect(() => {
    if (!isOpen) return;
    // Fetch real LAN IP from server so students on WiFi can connect
    fetch('/api/network-info')
      .then(res => res.json())
      .then((data: NetworkInfo) => setNetworkInfo(data))
      .catch(() => setNetworkInfo(null));
  }, [isOpen]);

  // Construct best share URL: prefer local network IP (192.168.x.x) over localhost so phones/tablets can open it
  const baseUrl = networkInfo?.primaryUrl && networkInfo.primaryIp !== 'localhost'
    ? networkInfo.primaryUrl
    : window.location.origin;

  const shareUrl = `${baseUrl}/?room=${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('Tautan ruang berhasil disalin!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedPin(true);
    toast.success(`Kode PIN ${roomId} berhasil disalin!`);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-[101]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1550aa] flex items-center justify-center text-white shadow-2xs">
                  <Share2 size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0a1a3a]">
                    {t('share', 'Bagikan')} Papan Tulis
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sinkronisasi interaktif langsung ke layar siswa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {/* View Mode Toggle: QR Code vs Direct Link */}
            <div className="flex p-1.5 bg-slate-100 border-b border-slate-200 gap-1 px-4">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-white text-[#1550aa] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode size={14} />
                <span>Pindai QR Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'link'
                    ? 'bg-white text-[#1550aa] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe size={14} />
                <span>Tautan & Kode PIN</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col items-center gap-5 text-center">
              {activeTab === 'qr' ? (
                /* 1. QR Code Mode (Zero Internet Needed, Instant Scan) */
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                    <QRCodeSVG
                      value={shareUrl}
                      size={170}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-[#0a1a3a] flex items-center justify-center gap-1.5">
                      <Smartphone size={14} className="text-[#1550aa]" />
                      <span>Arahkan Kamera HP / Tablet Siswa</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium max-w-xs leading-relaxed">
                      Siswa otomatis terhubung dan melihat pergerakan papan tulis secara live tanpa perlu login.
                    </p>
                  </div>
                </div>
              ) : (
                /* 2. Link & PIN Mode */
                <div className="w-full space-y-4 text-left">
                  {/* Room PIN Code */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-slate-400">
                      <span>Kode Sesi / PIN Ruang</span>
                      <span className="text-emerald-600 flex items-center gap-1 font-sans">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Live Sync
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl font-mono font-black text-[#1550aa] tracking-widest">
                        {roomId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPin}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPin ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copiedPin ? 'Tersalin' : 'Salin PIN'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Classroom URL */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Wifi size={13} className="text-[#1550aa]" />
                      <span>Tautan WiFi / Jaringan Kelas:</span>
                    </label>
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-300">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-transparent border-none outline-hidden text-xs font-mono font-semibold text-slate-800 px-2 truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3.5 py-1.5 bg-[#1550aa] hover:bg-[#0a1a3a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedLink ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Network Environment Pill */}
              <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Jaringan: {networkInfo?.primaryIp || 'Lokal'}</span>
                </span>
                <span className="font-mono text-slate-400">Port :3030</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareDialog;
