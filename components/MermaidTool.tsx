import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Download, Copy, RefreshCw, ZoomIn, ZoomOut, Check, AlertCircle, Edit3, Eye, Sparkles, Brain, GitBranch } from 'lucide-react';
import { toast } from '../utils/toast';
import { downloadFile, slugify } from '../utils/smartExport';
import { useStore } from '../store';

interface MermaidToolProps {
  id?: string;
  config: {
    code?: string;
    markdown?: string;
    title?: string;
  };
}

export const DEFAULT_MINDMAP = `mindmap
  root((Sistem Peredaran Darah))
    Jantung
      Atrium Kiri & Kanan
      Ventrikel Kiri & Kanan
      Katup Jantung
    Pembuluh Darah
      Arteri (Nadi)
      Vena (Balik)
      Kapiler
    Darah
      Sel Darah Merah (Eritrosit)
      Sel Darah Putih (Leukosit)
      Keping Darah (Trombosit)
      Plasma Darah`;

export const DEFAULT_FLOWCHART = `flowchart TD
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

/**
 * Robust converter from markdown hierarchical bullet lists / headings
 * into valid Mermaid mindmap syntax.
 */
export function markdownToMermaidMindmap(md: string, fallbackTitle = 'Peta Konsep'): string {
  const lines = md.split('\n');
  const result: string[] = ['mindmap'];
  let rootSet = false;
  let rootTitle = fallbackTitle;
  let currentHeadingLevel = 1;

  const sanitizeNode = (str: string): string => {
    // Remove characters that conflict with Mermaid syntax
    const clean = str.replace(/["'()\[\]{}]/g, '').trim();
    return clean || 'Node';
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Heading parsing: # Root, ## Branch, ### Sub-branch
    if (line.startsWith('#')) {
      const match = line.match(/^(#+)\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = sanitizeNode(match[2]);
        if (level === 1 && !rootSet) {
          rootTitle = text;
          rootSet = true;
          result.push(`  root((${rootTitle}))`);
          currentHeadingLevel = 1;
        } else {
          if (!rootSet) {
            rootSet = true;
            result.push(`  root((${rootTitle}))`);
          }
          currentHeadingLevel = level;
          const indent = '  '.repeat(Math.max(2, level));
          result.push(`${indent}${text}`);
        }
        continue;
      }
    }

    // Bullet parsing: - Item, * Item
    const bulletMatch = rawLine.match(/^(\s*)[-*+]\s+(.+)$/);
    if (bulletMatch) {
      if (!rootSet) {
        rootSet = true;
        result.push(`  root((${rootTitle}))`);
      }
      const rawSpaces = bulletMatch[1].replace(/\t/g, '  ').length;
      const bulletDepth = Math.floor(rawSpaces / 2);
      const effectiveLevel = currentHeadingLevel + 1 + bulletDepth;
      const text = sanitizeNode(bulletMatch[2]);
      const indent = '  '.repeat(Math.max(2, effectiveLevel));
      result.push(`${indent}${text}`);
      continue;
    }
  }

  if (!rootSet) {
    result.push(`  root((${rootTitle}))`);
  }

  return result.join('\n');
}

// Standalone Mermaid Loader
let mermaidPromise: Promise<any> | null = null;

function getMermaidInstance(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).mermaid) {
    return Promise.resolve((window as any).mermaid);
  }

  if (!mermaidPromise) {
    mermaidPromise = new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).mermaid) {
        resolve((window as any).mermaid);
        return;
      }

      const script = document.createElement('script');
      script.src = '/vendor/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).mermaid) {
          resolve((window as any).mermaid);
        } else {
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
    if ((window as any).mermaid) resolve((window as any).mermaid);
    else reject(new Error('Mermaid CDN failed to initialize'));
  };
  cdn.onerror = (e) => reject(e);
  document.head.appendChild(cdn);
}

export const MermaidTool: React.FC<MermaidToolProps> = ({ id, config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  // Resolve code: prioritize config.code, then convert config.markdown, then fallback to DEFAULT_MINDMAP
  const resolvedInitialCode = useMemo(() => {
    if (config.code && config.code.trim()) {
      return config.code.trim();
    }
    if (config.markdown && config.markdown.trim()) {
      return markdownToMermaidMindmap(config.markdown, config.title || 'Peta Konsep');
    }
    return DEFAULT_MINDMAP;
  }, [config.code, config.markdown, config.title]);

  const [activeCode, setActiveCode] = useState(resolvedInitialCode);

  useEffect(() => {
    setActiveCode(resolvedInitialCode);
  }, [resolvedInitialCode]);

  const title = config.title || 'Diagram Mermaid';

  const isMindmap = useMemo(() => {
    return activeCode.trim().startsWith('mindmap');
  }, [activeCode]);

  const isFlowchart = useMemo(() => {
    const c = activeCode.trim();
    return c.startsWith('flowchart') || c.startsWith('graph');
  }, [activeCode]);

  // Render diagram on change
  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setError(null);
        const mm = await getMermaidInstance();
        if (!mm) throw new Error('Engine Mermaid belum siap dimuat');

        mm.initialize({
          startOnLoad: false,
          theme: isMindmap ? 'base' : 'neutral',
          themeVariables: isMindmap ? {
            primaryColor: '#6366f1',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#4f46e5',
            lineColor: '#818cf8',
            secondaryColor: '#ec4899',
            tertiaryColor: '#10b981',
            fontFamily: 'Inter, system-ui, sans-serif'
          } : {
            fontFamily: 'Inter, system-ui, sans-serif'
          },
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif'
        });

        const uniqueId = `mermaid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { svg } = await mm.render(uniqueId, activeCode);
        if (isMounted) {
          setSvgHtml(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err?.message || 'Sintaks Mermaid tidak valid');
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [activeCode, retryKey, isMindmap]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    toast.success('Kode Mermaid berhasil disalin.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSvg = () => {
    if (!svgHtml) return;
    downloadFile(svgHtml, `${slugify(title)}_mermaid.svg`, 'image/svg+xml;charset=utf-8');
    toast.success('Vektor SVG diagram berhasil diunduh.');
  };

  const handleSaveCodeEdit = () => {
    setIsEditing(false);
    if (id) {
      useStore.getState().updateDomElement(id, {
        config: { ...config, code: activeCode }
      });
      toast.success('Diagram Mermaid diperbarui.');
    }
  };

  const handleSwitchToMindmapTemplate = () => {
    setActiveCode(DEFAULT_MINDMAP);
    setIsEditing(false);
  };

  const handleSwitchToFlowchartTemplate = () => {
    setActiveCode(DEFAULT_FLOWCHART);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#fafafa] text-slate-800 overflow-hidden font-sans select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200/90 text-xs shrink-0">
        <div className="flex items-center gap-2">
          {isMindmap ? (
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          )}
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider line-clamp-1">
            {title}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              isMindmap
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                : isFlowchart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-blue-50 text-blue-700 border border-blue-200/60'
            }`}
          >
            {isMindmap ? (
              <>
                <Brain size={11} /> Mindmap
              </>
            ) : isFlowchart ? (
              <>
                <GitBranch size={11} /> Flowchart
              </>
            ) : (
              'Mermaid'
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1.5 rounded-lg text-slate-600 transition cursor-pointer flex items-center gap-1 ${
              isEditing ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-slate-100'
            }`}
            title="Edit Kode Mermaid"
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span className="text-[10px] hidden sm:inline">{isEditing ? 'Lihat' : 'Edit'}</span>
          </button>
          
          <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

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
          <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />
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

      {/* Code Editor Drawer */}
      {isEditing && (
        <div className="bg-slate-900 text-slate-100 p-3 border-b border-slate-800 text-xs flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-400" /> Editor Kode Mermaid:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSwitchToMindmapTemplate}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-indigo-300 transition cursor-pointer"
              >
                Template Mindmap
              </button>
              <button
                onClick={handleSwitchToFlowchartTemplate}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-300 transition cursor-pointer"
              >
                Template Flowchart
              </button>
              <button
                onClick={handleSaveCodeEdit}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
              >
                <Check size={11} /> Terapkan
              </button>
            </div>
          </div>
          <textarea
            value={activeCode}
            onChange={(e) => setActiveCode(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 font-mono text-[11px] p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 text-slate-200 resize-y"
            placeholder="mindmap&#10;  root((Judul))&#10;    Cabang 1&#10;      Detail A"
          />
        </div>
      )}

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
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={12} /> Buka Editor
              </button>
              <button
                onClick={() => setRetryKey(k => k + 1)}
                className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} /> Coba Lagi
              </button>
            </div>
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
