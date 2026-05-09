
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { ChevronDown, Timer } from 'lucide-react';

export const AgentCursor: React.FC = () => {
  const { cursorPosition, isThinking, isActing, isClicking, currentAction, viewportTransform, agentMessage } = useStore();
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [thinkTime, setThinkTime] = useState(0);

  const zoom = viewportTransform[0];
  const panX = viewportTransform[4];
  const panY = viewportTransform[5];

  const screenX = cursorPosition.x * zoom + panX;
  const screenY = cursorPosition.y * zoom + panY;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isThinking) {
      setThinkTime(0);
      interval = setInterval(() => {
        setThinkTime((t) => t + 1);
      }, 1000);
    } else {
      setThinkTime(0);
    }
    return () => clearInterval(interval);
  }, [isThinking]);

  // Typewriter effect or simple delay for message
  useEffect(() => {
    if (agentMessage) {
      setDisplayMessage(agentMessage);
      const timer = setTimeout(() => {
        useStore.getState().setAgentMessage(null);
      }, 15000 + agentMessage.length * 50); // Read time increased
      return () => clearTimeout(timer);
    } else {
      setDisplayMessage(null);
    }
  }, [agentMessage]);

  let timeStatus = 'Memproses...';
  let timeColor = 'text-emerald-300';
  if (thinkTime > 15) {
    timeStatus = 'Agak lambat...';
    timeColor = 'text-rose-300';
  } else if (thinkTime > 7) {
    timeStatus = 'Normal...';
    timeColor = 'text-amber-300';
  }

  const isVisible = isThinking || isActing || !!displayMessage;
  
  return (
    <div
      className={`pointer-events-none absolute z-[100] flex flex-col items-start transition-all duration-500 will-change-transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-4'}`}
      style={{
        left: screenX,
        top: screenY,
        transform: 'translate(0, 0)', 
      }}
    >
      {/* SPEECH BUBBLE */}
      {displayMessage && (
         <div className="absolute bottom-8 left-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-auto">
            <details className="relative rounded-2xl rounded-bl-none bg-white shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden group min-w-[200px] max-w-[320px]">
               <summary className="p-3 text-sm font-semibold text-primary cursor-pointer hover:bg-slate-50 list-none flex items-center gap-2 select-none [&::-webkit-details-marker]:hidden relative">
                 <span className="relative flex h-2 w-2 mr-1">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                 </span>
                 Agen AI Merespons
                 <ChevronDown size={16} className="ml-auto group-open:rotate-180 transition-transform" />
               </summary>
               <div className="px-3 pb-3 pt-1 text-xs font-medium text-slate-800 border-t border-slate-100 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                 {displayMessage}
               </div>
               {/* Tail */}
               <div className="absolute -bottom-2 left-0 h-4 w-4 bg-white hidden group-open:block" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
            </details>
         </div>
      )}

      {/* The Cursor Tip (Figma style) */}
      <div className={`relative transition-transform duration-100 ${isClicking ? 'scale-75' : 'scale-100'}`}>
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          className="drop-shadow-lg"
        >
          <path 
            d="M3 3L10.5 20.5L13.5 13.5L20.5 10.5L3 3Z" 
            fill={isClicking ? "#ef4444" : "#2563eb"} 
            stroke="white" 
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        
        {/* Click Ripple Effect */}
        {isClicking && (
          <div className="absolute -left-2 -top-2 h-10 w-10 animate-ping rounded-full border-2 border-primary opacity-75"></div>
        )}
      </div>

      {/* Label / Status Bubble */}
      <div 
        className={`
          absolute left-5 top-5 flex items-center gap-2 whitespace-nowrap rounded-br-xl rounded-bl-xl rounded-tr-xl 
          bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg
          transition-all duration-300 origin-top-left
          ${(isThinking || currentAction) ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
        `}
      >
        {isThinking && (
          <div className="flex flex-col items-start gap-1">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-white" />
                <span>{currentAction || 'Thinking...'}</span>
             </div>
             <div className={`flex items-center gap-1.5 ${timeColor} text-[10px] w-full font-mono bg-black/20 px-1.5 py-0.5 rounded`}>
                <Timer size={10} />
                <span>{thinkTime}s</span>
                <span className="ml-1 opacity-80">{timeStatus}</span>
             </div>
          </div>
        )}
        {!isThinking && currentAction && (
           <span>{currentAction}</span>
        )}
      </div>
    </div>
  );
};
