import React, { useEffect, useRef, useState } from 'react';
import { Download, Copy, RefreshCw, ZoomIn, ZoomOut, Check, AlertCircle } from 'lucide-react';
import { toast } from '../utils/toast';
import { downloadFile, slugify } from '../utils/smartExport';

interface MermaidToolProps {
  config: {
    code?: string;
    title?: string;
  };
}

const DEFAULT_MERMAID = `flowchart TD
  A([Matahari]) -->|Fotosintesis| B[Tumbuhan Hijau / Produsen]
  B -->|Dimakan| C[Konsumen I / Herbivora]
  C -->|Dimakan| D[Konsumen II / Karnivora]
  D -->|Mati| E[Pengurai / Dekomposer]
  E -->|Unsur Hara| B
  style A fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
  style B fill:#dcfce7,stroke:#10b981,stroke-width:2px
  style C fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
  style D fill:#fee2e2,stroke:#ef4444,stroke-width:2px
  style E fill:#f3f4f6,stroke:#6b7280,stroke-width:2px`;

// Standalone Mermaid Loader — ensures all diagram types are built-in without fragile dynamic chunk imports
let mermaidPromise: Promise<any> | null = null;

function getMermaidInstance(): Promise<any> {
  if (typeof window !== 'undefined' && window.mermaid) {
    return Promise.resolve(window.mermaid);
  }

  if (!mermaidPromise) {
    mermaidPromise = new Promise((resolve, reject) => {
      // Check if already in DOM
      if (typeof window !== 'undefined' && window.mermaid) {
        resolve(window.mermaid);
        return;
      }

      const script = document.createElement('script');
      script.src = '/vendor/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        if (window.mermaid) {
          resolve(window.mermaid);
        } else {
          // CDN fallback
          loadCdnFallback(resolve, reject);
        }
      };
      script.onerror = () => {
        loadCdnFallback(resolve, reject);
      };
      document.head.appendChild(script);
    });
  }

  return mermaidPromise;
}

function loadCdnFallback(resolve: (val: any) => void, reject: (err: any) => void) {
  const cdn = document.createElement('script');
  cdn.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  cdn.async = true;
  cdn.onload = () => {
    if (window.mermaid) resolve(window.mermaid);
    else reject(new Error('Mermaid CDN failed to initialize'));
  };
  cdn.onerror = (e) => reject(e);
  document.head.appendChild(cdn);
}

export const MermaidTool: React.FC<MermaidToolProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const rawCode = (config.code || DEFAULT_MERMAID).trim();
  const title = config.title || 'Diagram Alur Mermaid';

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setError(null);
        const mm = await getMermaidInstance();
        if (!mm) throw new Error('Engine Mermaid belum siap dimuat');

        mm.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif'
        });

        const uniqueId = `mermaid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mm.render(uniqueId, rawCode);
        if (isMounted) {
          setSvgHtml(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (err?.message?.includes('dynamically imported') || err?.message?.includes('Failed to fetch')) {
          // Auto-heal stale browser cache with direct CDN bundle
          mermaidPromise = null;
          try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
            script.onload = async () => {
              if ((window as any).mermaid && isMounted) {
                const mm2 = (window as any).mermaid;
                mm2.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
                const { svg } = await mm2.render(`mermaid_heal_${Date.now()}`, rawCode);
                setSvgHtml(svg);
                setError(null);
              }
            };
            document.head.appendChild(script);
            return;
          } catch (_) {}
        }
        if (isMounted) {
          setError(err?.message || 'Sintaks Mermaid tidak valid');
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [rawCode, retryKey]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    toast.success('Kode Mermaid berhasil disalin.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSvg = () => {
    if (!svgHtml) return;
    downloadFile(svgHtml, `${slugify(title)}_diagram.svg`, 'image/svg+xml;charset=utf-8');
    toast.success('Vektor SVG diagram berhasil diunduh.');
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#fafafa] text-slate-800 overflow-hidden font-sans select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200/90 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider line-clamp-1">
            {title}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold hidden sm:inline">
            Mermaid Engine
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Perkecil"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-1.5 py-1 text-[10px] font-mono rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Perbesar"
          >
            <ZoomIn size={13} />
          </button>
          <div className="w-[1px] h-3 bg-slate-200 mx-1" />
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Salin Kode Mermaid"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
          <button
            onClick={handleExportSvg}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Unduh Vektor SVG"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-auto p-6 flex items-center justify-center bg-white/70">
        {error ? (
          <div className="max-w-md p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex flex-col gap-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold mb-0.5">Gagal merender diagram Mermaid:</div>
                <div className="font-mono text-[11px] opacity-90 break-all">{error}</div>
              </div>
            </div>
            <button
              onClick={() => setRetryKey(k => k + 1)}
              className="self-end px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} /> Coba Lagi
            </button>
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
            className="max-w-full flex items-center justify-center"
          />
        )}
      </div>
    </div>
  );
};
