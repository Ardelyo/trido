import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Volume2, VolumeX, Sparkles, User, Terminal } from 'lucide-react';
import { ChatMessage } from '../types';
import { toast } from '../utils/toast';

interface ChatMessageItemProps {
  message: ChatMessage;
  isLatest: boolean;
  isThinking: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isLatest,
  isThinking
}) => {
  const isModel = message.role === 'model';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Real-time typewriter streaming state
  const [displayedLength, setDisplayedLength] = useState<number>(() => {
    // If not the latest message or not from model, display immediately
    return !isModel || !isLatest ? message.text.length : 0;
  });
  const [isStreaming, setIsStreaming] = useState<boolean>(() => {
    return isModel && isLatest && message.text.length > 0;
  });
  const fullText = message.text || '';
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isModel || !isLatest) {
      setDisplayedLength(fullText.length);
      setIsStreaming(false);
      return;
    }

    // If message text updated while streaming or brand new
    let currentIdx = 0;
    setIsStreaming(true);

    const step = () => {
      // Stream in fast chunks (4-8 chars per frame for ultra-fast, responsive feel)
      currentIdx = Math.min(currentIdx + 6, fullText.length);
      setDisplayedLength(currentIdx);

      if (currentIdx < fullText.length) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setIsStreaming(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [fullText, isModel, isLatest]);

  const displayedText = useMemo(() => {
    if (!isModel) return fullText;
    if (!isStreaming) return fullText;
    return fullText.slice(0, displayedLength);
  }, [fullText, displayedLength, isModel, isStreaming]);

  const handleSkipStream = () => {
    if (isStreaming) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setDisplayedLength(fullText.length);
      setIsStreaming(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('Pesan disalin ke clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin pesan');
    }
  };

  const handleSpeakToggle = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Fitur Text-to-Speech tidak didukung di browser ini.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner TTS voice
    const cleanText = fullText
      .replace(/[*#`_~\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.05;

    // Pick Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith('id'));
    if (idVoice) utterance.voice = idVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!isModel) {
    return (
      <div className="flex flex-col items-end group w-full">
        <div className="flex items-center gap-1.5 mb-1 mr-1">
          <span className="text-[11px] font-semibold text-slate-400">Anda</span>
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User size={12} />
          </div>
        </div>
        <div className="bg-blue-600 text-white rounded-3xl rounded-tr-sm px-5 py-3.5 max-w-[88%] text-[14.5px] font-medium leading-relaxed shadow-md shadow-blue-600/10 select-text">
          {fullText}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start group w-full" onClick={handleSkipStream}>
      <div className="flex items-center justify-between w-full mb-1 ml-1 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles size={11} />
          </div>
          <span className="text-[11px] font-bold text-slate-700">Trido AI</span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-200/60">
            gemini-3.8-flash
          </span>
          {isStreaming && (
            <span className="text-[10px] text-emerald-600 font-semibold animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> realtime
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSpeakToggle();
            }}
            title={isSpeaking ? "Hentikan Suara" : "Baca Suara (TTS)"}
            className={`p-1 rounded-lg transition-colors ${isSpeaking ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title="Salin Markdown"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <div className="bg-white text-slate-800 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-3xl rounded-tl-sm p-4 lg:p-5 max-w-[95%] w-full overflow-hidden transition-all select-text">
        <div className="chat-markdown prose prose-slate max-w-none text-[14.5px] leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-lg font-black text-slate-900 mt-2 mb-2 pb-1 border-b border-slate-100" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-base font-bold text-slate-800 mt-2 mb-1.5" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-[15px] font-bold text-slate-800 mt-1.5 mb-1" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-2 last:mb-0 leading-relaxed text-slate-700" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-outside pl-5 my-2 space-y-1 text-slate-700" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-outside pl-5 my-2 space-y-1 text-slate-700" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="leading-relaxed" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-blue-500 bg-blue-50/40 pl-3 py-1 my-2 italic text-slate-600 rounded-r-lg" {...props} />
              ),
              table: ({ node, ...props }) => (
                <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                  <table className="w-full text-xs text-left" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="px-3 py-2 uppercase tracking-wider text-[11px]" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="px-3 py-2 border-b border-slate-100 last:border-0" {...props} />
              ),
              code: ({ node, inline, className, children, ...props }: any) => {
                const isInline = inline || (!className && !String(children).includes('\n'));
                if (isInline) {
                  return (
                    <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded-md font-mono text-[13px] font-semibold border border-slate-200/60" {...props}>
                      {children}
                    </code>
                  );
                }
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : '';
                return (
                  <div className="my-3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-slate-400 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Terminal size={12} className="text-blue-400" />
                        <span>{lang || 'code'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          toast.success('Kode disalin!');
                        }}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700 text-[10px]"
                      >
                        <Copy size={11} /> Salin
                      </button>
                    </div>
                    <pre className="p-3.5 overflow-x-auto text-xs font-mono text-indigo-200 leading-relaxed">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              },
              a: ({ node, ...props }) => (
                <a className="text-blue-600 hover:text-blue-800 underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-slate-900" {...props} />
              )
            }}
          >
            {displayedText || (isStreaming ? '▋' : '*Pesan kosong*')}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-blue-600 rounded-xs animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
};
