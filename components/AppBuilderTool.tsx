
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Eye, RefreshCw, Layers, Monitor, Smartphone, Maximize2 } from 'lucide-react';

interface AppBuilderToolProps {
  config: {
    html: string;
    css?: string;
    js?: string;
    title?: string;
  };
}

export const AppBuilderTool: React.FC<AppBuilderToolProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'CODE'>('PREVIEW');
  const [device, setDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [iframeKey, setIframeKey] = useState(0);
  
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 0; }
          ${config.css || ''}
        </style>
      </head>
      <body>
        ${config.html}
        <script>
          try {
            ${config.js || ''}
          } catch (e) {
            console.error('JS Error:', e);
            document.body.innerHTML += '<div style="color: red; padding: 20px; background: #fee; border: 1px solid red; margin: 20px; border-radius: 8px;"><strong>JS Runtime Error:</strong> ' + e.message + '</div>';
          }
        </script>
      </body>
    </html>
  `;

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden font-sans">
      {/* Mini App Toolbar */}
      <div className="flex h-12 bg-slate-800 border-b border-slate-700 px-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-950/50 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'PREVIEW' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className="flex items-center gap-1.5"><Eye size={12} /> PREVIEW</div>
            </button>
            <button 
              onClick={() => setActiveTab('CODE')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'CODE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className="flex items-center gap-1.5"><Code size={12} /> CODE</div>
            </button>
          </div>
          
          <div className="h-4 w-[1px] bg-slate-700" />
          
          <div className="flex gap-2">
            <button onClick={() => setDevice('DESKTOP')} className={`p-1.5 rounded hover:bg-slate-700 transition ${device === 'DESKTOP' ? 'text-indigo-400' : 'text-slate-500'}`} title="Desktop View"><Monitor size={14} /></button>
            <button onClick={() => setDevice('MOBILE')} className={`p-1.5 rounded hover:bg-slate-700 transition ${device === 'MOBILE' ? 'text-indigo-400' : 'text-slate-500'}`} title="Mobile View"><Smartphone size={14} /></button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/30 px-2 py-0.5 rounded">
            Virtual Environment V1.2
          </div>
          <button
            className="text-slate-400 hover:text-white transition"
            title="Download HTML"
            onClick={() => {
              const blob = new Blob([srcDoc], { type: 'text/html' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${config.title || 'app'}.html`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button className="text-slate-400 hover:text-slate-100 transition" title="Reload" onClick={() => setIframeKey(k => k + 1)}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-[#0a0a0c]">
        <AnimatePresence mode="wait">
          {activeTab === 'PREVIEW' ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,#1e1e2e_0%,#0a0a0c_100%)]"
            >
              <div 
                className={`bg-white shadow-2xl rounded-sm transition-all duration-500 overflow-hidden ${device === 'MOBILE' ? 'w-[375px] h-[667px]' : 'w-full h-full'}`}
              >
                <iframe 
                  key={iframeKey}
                  srcDoc={srcDoc}
                  title="App View"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="code"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full h-full p-4 overflow-auto font-mono text-sm leading-relaxed"
            >
              <div className="space-y-6 max-w-4xl mx-auto">
                <section>
                  <label className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2 block">index.html</label>
                  <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 border border-slate-800 overflow-x-auto">
                    <code>{config.html}</code>
                  </pre>
                </section>
                {config.css && (
                  <section>
                    <label className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2 block">styles.css</label>
                    <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 border border-slate-800 overflow-x-auto">
                      <code>{config.css}</code>
                    </pre>
                  </section>
                )}
                {config.js && (
                  <section>
                    <label className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-2 block">main.js</label>
                    <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 border border-slate-800 overflow-x-auto">
                      <code>{config.js}</code>
                    </pre>
                  </section>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer bar */}
      <div className="h-6 bg-indigo-600 px-3 flex items-center justify-between">
         <div className="text-[9px] font-bold text-white uppercase tracking-tighter">APP_READY: {config.title || 'Untitled App'}</div>
         <div className="flex gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
           <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
           <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
         </div>
      </div>
    </div>
  );
};
