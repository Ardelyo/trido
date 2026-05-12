
import React from 'react';
import { useStore } from '../store';
import { DomElementState } from '../types';
import { QuizMultipleChoice } from './quiz/QuizMultipleChoice';
import { QuizEssay } from './quiz/QuizEssay';
import { QuizTrueFalse } from './quiz/QuizTrueFalse';
import { QuizDragMatch } from './quiz/QuizDragMatch';
import { DocumentBlock } from './DocumentBlock';
import { TimerTool } from './TimerTool';
import { CalculatorTool } from './CalculatorTool';
import { AppBuilderTool } from './AppBuilderTool';
import { FlashcardTool } from './FlashcardTool';
import { DiagramRenderer } from './demo/DiagramRenderer';
import { WorksheetRenderer } from './demo/WorksheetRenderer';
import { QuizApp } from './quiz/QuizApp';
import { Printer } from 'lucide-react';

export const DomOverlay: React.FC = () => {
  const domElements = useStore(state => state.domElements);
  const viewportTransform = useStore(state => state.viewportTransform);
  const isActing = useStore(state => state.isActing);
  const removeDomElement = useStore(state => state.removeDomElement);

  const zoom = viewportTransform[0];
  const panX = viewportTransform[4];
  const panY = viewportTransform[5];

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    removeDomElement(id);
    const event = new CustomEvent('removeCanvasObject', { detail: { id } });
    window.dispatchEvent(event);
  };

  const handlePrint = (el: DomElementState, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const elementNode = document.getElementById(`widget-${el.id}`);
    if (!elementNode) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${el.componentType || 'Trido Document'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css" />
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              /* Hide interactive buttons during print */
              button { display: none !important; }
            }
            body { padding: 40px; font-family: 'Inter', sans-serif; }
            .print-container { max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${elementNode.innerHTML}
          </div>
          <script>
            // Wait for Tailwind, KaTeX and images to render
            setTimeout(() => {
              window.print();
              window.close();
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderContent = (el: DomElementState) => {
    if (el.componentType) {
      switch (el.componentType) {
        case 'QUIZ_MULTIPLE_CHOICE':
          return <QuizMultipleChoice config={el.config} />;
        case 'QUIZ_ESSAY':
          return <QuizEssay config={el.config} />;
        case 'QUIZ_TRUE_FALSE':
          return <QuizTrueFalse config={el.config} />;
        case 'QUIZ_DRAG_MATCH':
          return <QuizDragMatch config={el.config} />;
        case 'MARKDOWN_NOTE':
        case 'DOCUMENT_PAGE':
          return <DocumentBlock config={el.config} />;
        case 'TIMER':
          return <TimerTool config={el.config} />;
        case 'CALCULATOR':
          return <CalculatorTool />;
        case 'FLASHCARD':
          return <FlashcardTool config={el.config} />;
        case 'INTERACTIVE_APP':
          return <AppBuilderTool config={el.config} />;
        case 'DEMO_DIAGRAM':
          return <DiagramRenderer data={el.config} />;
        case 'DEMO_WORKSHEET':
          return <WorksheetRenderer content={el.config.content} type="worksheet" />;
        case 'DEMO_QUIZ':
          return <WorksheetRenderer content={el.config.content} type="quiz" />;
        case 'QUIZ_APP':
          return <QuizApp config={el.config} />;
        // More sophisticated components can be added as raw items here
      }
    }
    
    // Fallback to traditional raw HTML injected into an iframe
    return (
      <iframe
        srcDoc={el.html}
        title={el.id}
        className={`absolute inset-0 h-full w-full border-0 ${isActing ? 'pointer-events-none' : 'pointer-events-auto'}`}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden selection:bg-cyber-primary/30">
      <div 
        className="absolute inset-0 will-change-transform"
        style={{ 
          transform: `matrix(${viewportTransform.join(',')})`,
          transformOrigin: '0 0',
        }}
      >
        {Object.values(domElements).map((el: DomElementState) => {
          const rotation = el.rotation;

          return (
            <div
              key={el.id}
              className={`absolute flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_4px_30px_rgba(0,0,0,0.1)] ring-1 ring-black/5 transition-opacity duration-300 will-change-transform ${isActing ? 'opacity-50' : 'opacity-100'}`}
              style={{
                width: `${el.width}px`,
                height: `${el.height}px`,
                left: el.x,
                top: el.y,
                transform: `translate(-50%, -50%) scale(${el.scaleX}, ${el.scaleY}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                pointerEvents: 'auto',
              }}
            >
              {/* Header / Command Bar */}
              <div className="flex h-10 w-full items-center gap-2 bg-[#f8fafc] px-3 border-b border-slate-200 shrink-0 select-none items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 shadow-sm text-slate-500">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                   </div>
                   <div className="text-xs font-bold text-slate-600 font-sans tracking-wide">
                     {el.componentType ? el.componentType.split('_').join(' ') : 'WEB APP'}
                   </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onMouseDown={(e) => e.stopPropagation()} 
                    onClick={(e) => handlePrint(el, e)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    title="Cetak / Unduh PDF"
                  >
                    <Printer size={14} />
                  </button>
                  <button 
                    onMouseDown={(e) => e.stopPropagation()} 
                    onClick={(e) => handleDelete(el.id, e)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Close"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              {/* Application Content */}
              <div id={`widget-${el.id}`} className="flex-1 bg-white relative overflow-auto pointer-events-auto">
                {renderContent(el)}
                
                {isActing && (
                  <div className="absolute inset-0 z-50 bg-[#00f0ff]/5 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-black/90 px-3 py-1 rounded border border-cyber-primary/50 text-cyber-primary text-[10px] font-mono animate-pulse tracking-tighter">
                      AGENT_INTERACTING...
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
