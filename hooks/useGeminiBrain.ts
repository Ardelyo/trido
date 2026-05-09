import React, { useCallback } from 'react';
import { useStore } from '../store';
import { generateAgentActions } from '../services/geminiService';
import { CanvasObjectData, AgentAction, Point } from '../types';

export const useGeminiBrain = () => {
  const { setThinking, addAction, addLog, addMessage, setAgentMessage } = useStore();

  const processUserPrompt = useCallback(async (
    prompt: string, 
    canvasRef: React.MutableRefObject<any>
  ) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const storeState = useStore.getState();

    setThinking(true);
    addLog(`Pemindaian neural dimulai...`);

    try {
      // --- 1. VIEWPORT CAPTURE (The "Eye") ---
      const vpt = [...canvas.viewportTransform]; 
      const width = canvas.width;
      const height = canvas.height;

      const invVpt = window.fabric.util.invertTransform(vpt);
      const tl = window.fabric.util.transformPoint({ x: 0, y: 0 }, invVpt);
      const br = window.fabric.util.transformPoint({ x: width, y: height }, invVpt);
      
      const screenToWorld = (screenX: number, screenY: number): Point => {
        const point = window.fabric.util.transformPoint(
          { x: screenX, y: screenY },
          invVpt
        );
        return { x: point.x, y: point.y };
      };

      // --- 2. CONTEXT GATHERING ---
      const dataUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 1, 
        left: tl.x,
        top: tl.y,
        width: br.x - tl.x,
        height: br.y - tl.y
      });

      const rawObjects = canvas.getObjects();
      
      const objectsJson: CanvasObjectData[] = rawObjects
        .map((obj: any) => {
          const inView = obj.left > tl.x - 500 && obj.left < br.x + 500 && obj.top > tl.y - 500 && obj.top < br.y + 500;
          if (!inView && rawObjects.length > 20) return null;

          const baseData: CanvasObjectData = {
            id: obj.id || `obj_${Math.random().toString(36).substr(2, 9)}`,
            type: obj.type,
            left: Math.round(obj.left || 0),
            top: Math.round(obj.top || 0),
            fill: typeof obj.fill === 'string' ? obj.fill : 'mixed',
            angle: Math.round(obj.angle || 0),
            width: Math.round(obj.width * (obj.scaleX || 1)),
            height: Math.round(obj.height * (obj.scaleY || 1)),
          };

          if (obj.isDomPlaceholder) {
            baseData.htmlContent = storeState.domElements[obj.id]?.html;
          } else if (obj.svgSource) {
            baseData.svgContent = obj.svgSource; 
          } else if (obj.type === 'i-text' || obj.type === 'text') {
            baseData.textContent = obj.text;
          }
          return baseData;
        })
        .filter(Boolean);

      // --- 3. AI REQUEST ---
      const { functionCalls, textResponse, thought } = await generateAgentActions(
        prompt, 
        dataUrl, 
        objectsJson, 
        { width: br.x - tl.x, height: br.y - tl.y }, 
        storeState.lastUploadedImage,
        storeState.messages.slice(-10), // Send last 10 messages for context
        { current: storeState.currentPageIndex, total: storeState.pages.length },
        storeState.domElements
      );

      if (thought) {
        addLog(`AI Thoughts: ${thought}`);
      }
      
      // Clear the uploaded image so it's not sent again automatically
      useStore.getState().setLastUploadedImage(null);

      const msg = textResponse || (functionCalls.length > 0 ? "Menjalankan tindakan." : "Menunggu perintah.");
      addMessage({ role: 'model', text: msg });
      setAgentMessage(msg);

      // --- 4. ACTION MAPPING FROM SMALL MODEL TOOLS ---
      
      let lastWorldPos = { x: (tl.x + br.x) / 2, y: (tl.y + br.y) / 2 };

      const getPos = (gridPos?: string, relativePos?: string) => {
        const vWidth = br.x - tl.x;
        const vHeight = br.y - tl.y;
      
        if (relativePos) {
           let offset = { x: 0, y: 0 };
           if (relativePos === 'CENTER') offset = { x: 0, y: 0 };
           else if (relativePos === 'RIGHT_OF_LAST') offset = { x: 350, y: 0 };
           else if (relativePos === 'BELOW_LAST') offset = { x: 0, y: 200 };
           else if (relativePos === 'LEFT_OF_LAST') offset = { x: -350, y: 0 };
           else if (relativePos === 'ABOVE_LAST') offset = { x: 0, y: -200 };
           lastWorldPos = { x: lastWorldPos.x + offset.x, y: lastWorldPos.y + offset.y };
           return lastWorldPos;
        }

        if (gridPos) {
          const gw = vWidth / 3;
          const gh = vHeight / 3;
          let pt = { x: tl.x + vWidth/2, y: tl.y + vHeight/2 };
          if (gridPos.includes('TOP')) pt.y = tl.y + gh/2;
          if (gridPos.includes('BOTTOM')) pt.y = tl.y + vHeight - gh/2;
          if (gridPos.includes('LEFT')) pt.x = tl.x + gw/2;
          if (gridPos.includes('RIGHT')) pt.x = tl.x + vWidth - gw/2;
          lastWorldPos = pt;
          return pt;
        }

        return lastWorldPos;
      };

      functionCalls.forEach((call, index) => {
        const args = (call.args || {}) as Record<string, any>;
        let actionType: AgentAction['type'] | null = null;
        let payload: any = {};

        if (call.name === 'add_mindmap_node') {
           actionType = 'CREATE_SHAPE';
           const pos = getPos(undefined, args.relativePosition);
           let fill = '#3B82F6';
           let width = 200;
           let height = 80;
           if (args.style === 'MAIN_TOPIC') { fill = '#1D4ED8'; width = 250; height = 100; }
           else if (args.style === 'DETAIL') { fill = '#93C5FD'; width = 150; height = 60; }
           else if (args.style === 'HIGHLIGHT') { fill = '#F59E0B'; }
           
           payload = { 
             shapeType: 'RECTANGLE', 
             x: pos.x, y: pos.y, 
             text: args.text, 
             fill, width, height, 
             textColor: '#FFFFFF',
             idAlias: `node_${index}` // to track creation order context
           };
        } else if (call.name === 'connect_nodes') {
           actionType = 'DRAW_PATH'; 
           payload = {
              fromNodeText: args.fromNodeText,
              toNodeText: args.toNodeText,
              lineStyle: args.lineStyle
           };
        } else if (call.name === 'add_text_label') {
           actionType = 'WRITE_TEXT';
           const pos = getPos(args.gridPosition, undefined);
           let fontSize = 24;
           if(args.size === 'TITLE') fontSize = 48;
           if(args.size === 'SUBTITLE') fontSize = 32;
           payload = { text: args.text, x: pos.x, y: pos.y, fontSize, color: '#000000' };
        } else if (call.name === 'update_component') {
           actionType = 'EDIT_HTML';
           payload = {
             objectId: args.objectId,
             config: JSON.parse(args.configJson)
           };
        } else if (call.name === 'add_component') {
           actionType = 'RENDER_HTML';
           const pos = getPos(args.gridPosition, undefined);
           
           // Generate HTML template based on component type and config
           let html = `<div>${args.componentType}</div>`;
           if (args.configJson) {
              try {
                 const cfg = JSON.parse(args.configJson);
                 if (args.componentType === 'QUIZ_MULTIPLE_CHOICE') {
                    html = `<div class="p-6 bg-white rounded-xl shadow-xl w-full h-full font-sans border-2 border-indigo-100 flex flex-col justify-center">
                      <h3 class="text-2xl font-bold mb-6 text-gray-800 text-center">${cfg.question || 'Quiz Question'}</h3>
                      <div class="space-y-3">
                        ${(cfg.options || []).map((opt: string, i: number) => 
                          `<button onclick="this.className='w-full text-left p-4 rounded-xl border border-transparent ${i === cfg.correctIndex ? "bg-green-100 text-green-800 font-bold border-green-500" : "bg-red-100 text-red-800 font-bold border-red-500"}'" class="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all font-medium text-gray-700 bg-white shadow-sm">${opt}</button>`
                        ).join('')}
                      </div>
                    </div>`;
                 } else if (args.componentType === 'CALCULATOR') {
                    html = `<div class="p-6 bg-gray-50 flex flex-col w-full h-full rounded-2xl shadow-xl border border-gray-200">
                        <div class="text-4xl font-mono bg-white w-full text-right p-4 border rounded-xl shadow-inner mb-4 overflow-hidden truncate">0</div>
                        <div class="grid grid-cols-4 gap-3 flex-1">
                           <button class="bg-white hover:bg-gray-100 transition-colors rounded-xl shadow-sm border border-gray-200 font-bold text-xl text-gray-700">7</button>
                           <button class="bg-white hover:bg-gray-100 transition-colors rounded-xl shadow-sm border border-gray-200 font-bold text-xl text-gray-700">8</button>
                           <button class="bg-white hover:bg-gray-100 transition-colors rounded-xl shadow-sm border border-gray-200 font-bold text-xl text-gray-700">9</button>
                           <button class="bg-indigo-500 hover:bg-indigo-600 outline-none focus:ring-4 focus:ring-indigo-300 transition-colors rounded-xl shadow-md font-bold text-xl text-white">/</button>
                           <!-- Simple layout just for show -->
                           <button class="col-span-4 bg-indigo-600 hover:bg-indigo-700 outline-none focus:ring-4 focus:ring-indigo-300 transition-colors rounded-xl shadow-md font-bold text-xl text-white mt-auto py-3">=</button>
                        </div>
                    </div>`;
                 } else if (args.componentType === 'FLASHCARD') {
                    html = `<div class="w-full h-full perspective-1000">
                      <div class="relative w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer hover:rotate-y-180" onclick="this.classList.toggle('rotate-y-180')">
                        <div class="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-200 rounded-2xl shadow-lg flex items-center justify-center p-8">
                          <h2 class="text-3xl font-bold text-indigo-900 text-center">${cfg.front || 'Front of Card'}</h2>
                        </div>
                        <div class="absolute w-full h-full backface-hidden bg-indigo-50 border-2 border-indigo-300 rounded-2xl shadow-lg flex items-center justify-center p-8 rotate-y-180">
                          <p class="text-xl text-indigo-800 text-center leading-relaxed">${cfg.back || 'Back of Card'}!</p>
                        </div>
                      </div>
                      <style>
                        .perspective-1000 { perspective: 1000px; }
                        .transform-style-preserve-3d { transform-style: preserve-3d; }
                        .backface-hidden { backface-visibility: hidden; }
                        .rotate-y-180 { transform: rotateY(180deg); }
                      </style>
                    </div>`;
                 } else if (args.componentType === 'TIMER') {
                    const time = cfg.seconds || 60;
                    const mins = Math.floor(time / 60).toString().padStart(2, '0');
                    const secs = (time % 60).toString().padStart(2, '0');
                    html = `<div class="p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl w-full h-full flex flex-col items-center justify-center border border-gray-700">
                      <div class="text-6xl font-mono text-white mb-8 tracking-wider font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" id="timer-display">${mins}:${secs}</div>
                      <div class="flex gap-4">
                        <button class="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30">Reset</button>
                        <button class="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30">Start</button>
                      </div>
                    </div>`;
                 } else if (args.componentType === 'CHECKLIST') {
                    html = `<div class="p-6 bg-white rounded-2xl shadow-xl w-full h-full border border-gray-100 flex flex-col">
                      <h3 class="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">${cfg.title || 'Checklist'}</h3>
                      <div class="flex-1 overflow-y-auto space-y-3">
                        ${(cfg.items || ['Item 1', 'Item 2']).map((item: string) => `
                          <label class="flex items-center p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 cursor-pointer transition-colors group">
                            <div class="relative flex items-center justify-center w-6 h-6 mr-4 border-2 border-gray-300 rounded focus-within:border-blue-500 transition-colors bg-white">
                              <input type="checkbox" class="peer absolute opacity-0 w-full h-full cursor-pointer" onchange="this.nextElementSibling.classList.toggle('hidden', !this.checked); this.parentElement.nextElementSibling.classList.toggle('line-through', this.checked); this.parentElement.nextElementSibling.classList.toggle('text-gray-400', this.checked);" />
                              <svg class="hidden w-4 h-4 text-blue-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <span class="text-lg font-medium text-gray-700 transition-colors">${item}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>`;
                 } else {
                    html = `<div class="p-4 bg-white rounded shadow text-lg w-full h-full">${JSON.stringify(cfg)}</div>`;
                 }
              } catch(e) {}
           }
           let configObj = undefined;
           let pWidth = 450;
           let pHeight = 400;
           if (args.configJson) {
              try { configObj = JSON.parse(args.configJson); } catch(e) {}
              if (args.componentType === 'DOCUMENT_PAGE' || args.componentType === 'MARKDOWN_NOTE') {
                 pWidth = 650;
                 pHeight = 800;
              }
           }
           payload = { html, x: pos.x, y: pos.y, width: pWidth, height: pHeight, componentType: args.componentType, config: configObj };
        } else if (call.name === 'pan_camera') {
           actionType = 'PAN_CAMERA';
           payload = {
             objectId: args.targetObjectId,
             direction: args.direction
           };
        } else if (call.name === 'modify_object') {
           if (args.action === 'MOVE_TO_GRID') {
              actionType = 'DRAG_OBJECT';
              const pos = getPos(args.value);
              payload = { objectId: args.objectId, toX: pos.x, toY: pos.y };
           } else if (args.action === 'DELETE') {
              actionType = 'DELETE_OBJECT';
              payload = { objectId: args.objectId };
           } else if (args.action === 'UPDATE_TEXT') {
              actionType = 'MODIFY_PROPERTY';
              payload = { objectId: args.objectId, property: 'text', value: args.value };
           } else {
              actionType = 'RESIZE_OBJECT'; // Custom/ignored
           }
        } else if (call.name === 'add_interactive_app') {
           actionType = 'RENDER_HTML';
           const pos = getPos(args.gridPosition, undefined);
           payload = { 
             html: '', 
             x: pos.x, y: pos.y, 
             width: 800, height: 600, 
             componentType: 'INTERACTIVE_APP', 
             config: { 
               html: args.html || '', 
               css: args.css || '', 
               js: args.js || '', 
               title: args.title || 'Interactive App' 
             } 
           };
        } else if (call.name === 'add_image') {
           actionType = 'CREATE_IMAGE';
           const pos = getPos(args.gridPosition);
           payload = { base64: args.base64Data, x: pos.x, y: pos.y, width: 300 };
        }

        if (!actionType) return;

        addAction({
          id: `action_${Date.now()}_${index}`,
          type: actionType,
          payload,
          status: 'PENDING'
        });
      });

    } catch (error) {
      console.error(error);
      const errorMsg = "Sinkronisasi kognitif gagal.";
      addMessage({ role: 'model', text: errorMsg });
      setAgentMessage(errorMsg);
    } finally {
      setThinking(false);
    }
  }, [setThinking, addAction, addLog, addMessage, setAgentMessage]);

  return { processUserPrompt };
};
