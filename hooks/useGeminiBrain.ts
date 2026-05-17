import React, { useCallback } from 'react';
import { useStore } from '../store';
import { AiServiceError, generateAgentActions } from '../services/aiService';
import { Point, CanvasObjectData, AgentAction } from '../types';
import { CALCULATOR_TEMPLATE, TIMER_TEMPLATE } from '../services/componentTemplates';
import { createLogger } from '../utils/logger';
import { sounds } from '../utils/sounds';

const logger = createLogger('gemini-brain');

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
    sounds.play('thinking');
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
      // Snapshot at half resolution — reduces payload by ~75%, sufficient for AI vision
      const dataUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 0.5,
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
      const _aiResult = await generateAgentActions(
        prompt,
        dataUrl,
        objectsJson,
        { width: br.x - tl.x, height: br.y - tl.y },
        storeState.lastUploadedImage,
        // Send last 8 messages — enough for context, avoids bloating the prompt
        storeState.messages.slice(-8).map(m => ({ role: m.role, text: m.text })),
        { current: storeState.currentPageIndex, total: storeState.pages.length },
        storeState.domElements
      );
      let functionCalls = _aiResult.functionCalls;
      const { textResponse, thought } = _aiResult;

      if (thought) {
        addLog(`AI Thoughts: ${thought}`);
      }

      // Clear the uploaded image so it's not sent again automatically
      useStore.getState().setLastUploadedImage(null);

      const msg = textResponse || (functionCalls.length > 0 ? "Menjalankan tindakan." : "Menunggu perintah.");
      addMessage({ role: 'model', text: msg });
      setAgentMessage(msg);

      // --- 4. ACTION MAPPING FROM SMALL MODEL TOOLS ---

      // Safety cap — prevent the small model from flooding the queue with 30+ calls
      const MAX_CALLS = 20;
      if (functionCalls.length > MAX_CALLS) {
        logger.warn(`[Cap] Clamping ${functionCalls.length} function calls to ${MAX_CALLS}`);
        functionCalls = functionCalls.slice(0, MAX_CALLS);
      }

      // Deduplication guard — prevents AI looping by enqueuing duplicate calls
      // e.g. AI sends add_mindmap_node('X', CENTER) twice in one batch
      const seenCallSigs = new Set<string>();

      let lastWorldPos = { x: (tl.x + br.x) / 2, y: (tl.y + br.y) / 2 };
      // Track last node size for accurate relative positioning
      let lastNodeW = 210;
      let lastNodeH = 80;

      // Style config: dimensions and fill colors
      const NODE_STYLE: Record<string, { fill: string; width: number; height: number }> = {
        MAIN_TOPIC: { fill: '#4F46E5', width: 260, height: 100 },
        SUBTOPIC:   { fill: '#0EA5E9', width: 210, height: 80  },
        DETAIL:     { fill: '#475569', width: 170, height: 60  },
        HIGHLIGHT:  { fill: '#F59E0B', width: 210, height: 80  },
      };
      const GAP_X = 60;
      const GAP_Y = 44;

      const getPos = (gridPos?: string, relativePos?: string) => {
        const vWidth = br.x - tl.x;
        const vHeight = br.y - tl.y;

        if (relativePos) {
           let offset = { x: 0, y: 0 };
           if (relativePos === 'CENTER') {
             // Reset to viewport center
             lastWorldPos = { x: (tl.x + br.x) / 2, y: (tl.y + br.y) / 2 };
             return lastWorldPos;
           }
           else if (relativePos === 'RIGHT_OF_LAST') offset = { x: lastNodeW + GAP_X, y: 0 };
           else if (relativePos === 'BELOW_LAST')  offset = { x: 0, y: lastNodeH + GAP_Y };
           else if (relativePos === 'LEFT_OF_LAST') offset = { x: -(lastNodeW + GAP_X), y: 0 };
           else if (relativePos === 'ABOVE_LAST')  offset = { x: 0, y: -(lastNodeH + GAP_Y) };
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
           const styleKey = (args.style as string) || 'SUBTOPIC';
           const styleConf = NODE_STYLE[styleKey] || NODE_STYLE.SUBTOPIC;
           const pos = getPos(undefined, args.relativePosition);
           // Update tracked size AFTER getPos so next node uses this node's dimensions
           lastNodeW = styleConf.width;
           lastNodeH = styleConf.height;

           payload = {
             shapeType: 'RECTANGLE',
             x: pos.x, y: pos.y,
             text: args.text,
             fill: styleConf.fill,
             width: styleConf.width,
             height: styleConf.height,
             textColor: '#FFFFFF',
             idAlias: `node_${index}`
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
           let parsedUpdateConfig = {};
           try { parsedUpdateConfig = JSON.parse(args.configJson); } catch (_) {}
           payload = {
             objectId: args.objectId,
             config: parsedUpdateConfig
           };
        } else if (call.name === 'add_component') {
           actionType = 'RENDER_HTML';
           const pos = getPos(args.gridPosition, undefined);

           // Generate HTML template based on component type and config
           let html = `<div>${args.componentType}</div>`;
           let configObj: any = undefined;
           let pWidth = 450;
           let pHeight = 400;

           if (args.configJson) {
              try {
                 configObj = JSON.parse(args.configJson);
                 if (args.componentType === 'DOCUMENT_PAGE' || args.componentType === 'MARKDOWN_NOTE') {
                    pWidth = 650;
                    pHeight = 800;
                 }
              } catch(e) {}
           }

           if (args.componentType === 'CALCULATOR') {
              html = CALCULATOR_TEMPLATE;
              pWidth = 350;
              pHeight = 500;
           } else if (args.componentType === 'TIMER') {
              html = TIMER_TEMPLATE(configObj?.seconds || 300);
              pWidth = 300;
              pHeight = 250;
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
        }

        if (!actionType) return;

        // Deduplication: build a signature from tool name + key args
        const sig = [
          call.name,
          args.text || '',
          args.gridPosition || '',
          args.relativePosition || '',
          args.objectId || '',
          args.fromNodeText || '',
          args.toNodeText || ''
        ].join(':');
        if (seenCallSigs.has(sig)) {
          logger.warn(`[Dedup] Duplicate tool call skipped: ${sig}`);
          return;
        }
        seenCallSigs.add(sig);

        addAction({
          id: `action_${Date.now()}_${index}`,
          type: actionType,
          payload,
          status: 'PENDING'
        });
      });

    } catch (error: any) {
      logger.error('Failed to process prompt', error);
      
      let errorMsg = "Sinkronisasi kognitif gagal. Coba lagi atau periksa koneksi AI.";
      
      if (error instanceof AiServiceError) {
        errorMsg = error.message;
      } else if (error.message && error.message.includes("Ollama Error")) {
        errorMsg = `Kesalahan AI Lokal: ${error.message.replace("Ollama Error: ", "")}`;
        if (error.message.includes("memory")) {
          errorMsg += " (Sistem kehabisan RAM untuk menjalankan model ini)";
        }
      }

      addMessage({ role: 'model', text: errorMsg });
      addLog(`AI error: ${errorMsg}`);
      setAgentMessage(errorMsg);
    } finally {
      setThinking(false);
      sounds.stop('thinking');
    }
  }, [setThinking, addAction, addLog, addMessage, setAgentMessage]);

  return { processUserPrompt };
};
