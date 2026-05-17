import React, { useCallback } from 'react';
import { useStore } from '../store';
import { AiServiceError, generateAgentActions } from '../services/aiService';
import { Point, CanvasObjectData, AgentAction } from '../types';
import { CALCULATOR_TEMPLATE, TIMER_TEMPLATE } from '../services/componentTemplates';
import { createLogger } from '../utils/logger';
import { sounds } from '../utils/sounds';
import { layoutMindmap, NODE_STYLE_CONFIG, MindmapInputNode } from '../utils/mindmapLayout';

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
      // --- 1. VIEWPORT CAPTURE ---
      const vpt = [...canvas.viewportTransform];
      const width = canvas.width;
      const height = canvas.height;

      const invVpt = window.fabric.util.invertTransform(vpt);
      const tl = window.fabric.util.transformPoint({ x: 0, y: 0 }, invVpt);
      const br = window.fabric.util.transformPoint({ x: width, y: height }, invVpt);

      const screenToWorld = (screenX: number, screenY: number): Point => {
        const point = window.fabric.util.transformPoint({ x: screenX, y: screenY }, invVpt);
        return { x: point.x, y: point.y };
      };

      // --- 2. CONTEXT GATHERING ---
      // 0.3x resolution — 40% fewer image tokens vs 0.5x, still sufficient for shape/text
      const dataUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 0.3,
        left: tl.x, top: tl.y,
        width: br.x - tl.x, height: br.y - tl.y
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
        storeState.messages.slice(-8).map(m => ({ role: m.role, text: m.text })),
        { current: storeState.currentPageIndex, total: storeState.pages.length },
        storeState.domElements
      );
      let functionCalls = _aiResult.functionCalls;
      const { textResponse, thought } = _aiResult;

      if (thought) addLog(`AI Thoughts: ${thought}`);
      useStore.getState().setLastUploadedImage(null);

      const msg = textResponse || (functionCalls.length > 0 ? 'Menjalankan tindakan.' : 'Menunggu perintah.');
      addMessage({ role: 'model', text: msg });
      setAgentMessage(msg);

      // --- 4. POST-PROCESSING PIPELINE ---

      // Stage 1: Hard cap on total calls
      const MAX_CALLS = 15;
      if (functionCalls.length > MAX_CALLS) {
        logger.warn(`[Cap] Clamping ${functionCalls.length} calls to ${MAX_CALLS}`);
        functionCalls = functionCalls.slice(0, MAX_CALLS);
      }

      // Stage 2: Deduplication
      const seenSigs = new Set<string>();
      functionCalls = functionCalls.filter(call => {
        const args = call.args || {};
        const sig = [call.name, args.text || '', args.gridPosition || '', args.parentNodeText || '', args.objectId || '', args.fromNodeText || '', args.toNodeText || ''].join(':');
        if (seenSigs.has(sig)) { logger.warn(`[Dedup] Skipped: ${sig}`); return false; }
        seenSigs.add(sig);
        return true;
      });

      // Stage 3: Separate mindmap nodes from other calls
      const mindmapCalls = functionCalls.filter(c => c.name === 'add_mindmap_node');
      const otherCalls = functionCalls.filter(c => c.name !== 'add_mindmap_node' && c.name !== 'connect_nodes');
      // connect_nodes is only used for non-mindmap diagrams
      const connectCalls = functionCalls.filter(c => c.name === 'connect_nodes');

      // ── Viewport center (world coords) ─────────────────────────────────────
      const centerX = (tl.x + br.x) / 2;
      const centerY = (tl.y + br.y) / 2;
      let lastWorldPos = { x: centerX, y: centerY };

      const getGridPos = (gridPos?: string) => {
        if (!gridPos) return lastWorldPos;
        const vWidth = br.x - tl.x;
        const vHeight = br.y - tl.y;
        const gw = vWidth / 3, gh = vHeight / 3;
        let pt = { x: tl.x + vWidth / 2, y: tl.y + vHeight / 2 };
        if (gridPos.includes('TOP')) pt.y = tl.y + gh / 2;
        if (gridPos.includes('BOTTOM')) pt.y = tl.y + vHeight - gh / 2;
        if (gridPos.includes('LEFT')) pt.x = tl.x + gw / 2;
        if (gridPos.includes('RIGHT')) pt.x = tl.x + vWidth - gw / 2;
        lastWorldPos = pt;
        return pt;
      };

      // ── ACTION QUEUES (nodes first, then connections, then everything else) ──
      const shapeActions: AgentAction[] = [];
      const pathActions: AgentAction[] = [];
      const otherActions: AgentAction[] = [];

      // ── Mind map via layout engine ──────────────────────────────────────────
      if (mindmapCalls.length > 0) {
        const inputNodes: MindmapInputNode[] = mindmapCalls.map(c => ({
          text: c.args.text,
          style: (c.args.style || 'SUBTOPIC') as MindmapInputNode['style'],
          parentNodeText: c.args.parentNodeText || null,
        }));

        const laid = layoutMindmap(inputNodes, centerX, centerY);

        laid.forEach((node, idx) => {
          const s = NODE_STYLE_CONFIG[node.style] || NODE_STYLE_CONFIG.SUBTOPIC;
          shapeActions.push({
            id: `action_mm_${Date.now()}_${idx}`,
            type: 'CREATE_SHAPE',
            payload: {
              shapeType: 'RECTANGLE',
              x: node.x, y: node.y,
              text: node.text,
              fill: s.fill, width: s.width, height: s.height,
              textColor: '#FFFFFF',
            },
            status: 'PENDING'
          });

          // Auto-generate connection from parent → this node
          if (node.parentNodeText) {
            pathActions.push({
              id: `action_conn_${Date.now()}_${idx}`,
              type: 'DRAW_PATH',
              payload: { fromNodeText: node.parentNodeText, toNodeText: node.text, lineStyle: 'ARROW_STRAIGHT' },
              status: 'PENDING'
            });
          }
        });

        logger.info(`[MindMap] Layout engine placed ${laid.length} nodes, ${pathActions.length} connections`);
      }

      // ── Freeform connect_nodes (non-mindmap) ───────────────────────────────
      connectCalls.forEach((call, idx) => {
        pathActions.push({
          id: `action_conn_free_${Date.now()}_${idx}`,
          type: 'DRAW_PATH',
          payload: { fromNodeText: call.args.fromNodeText, toNodeText: call.args.toNodeText, lineStyle: call.args.lineStyle },
          status: 'PENDING'
        });
      });

      // ── All other tool calls ────────────────────────────────────────────────
      otherCalls.forEach((call, index) => {
        const args = (call.args || {}) as Record<string, any>;
        let actionType: AgentAction['type'] | null = null;
        let payload: any = {};

        if (call.name === 'add_text_label') {
          actionType = 'WRITE_TEXT';
          const pos = getGridPos(args.gridPosition);
          let fontSize = 24;
          if (args.size === 'TITLE') fontSize = 48;
          if (args.size === 'SUBTITLE') fontSize = 32;
          payload = { text: args.text, x: pos.x, y: pos.y, fontSize, color: '#000000' };

        } else if (call.name === 'update_component') {
          actionType = 'EDIT_HTML';
          let parsedUpdateConfig = {};
          try { parsedUpdateConfig = JSON.parse(args.configJson); } catch (_) {}
          payload = { objectId: args.objectId, config: parsedUpdateConfig };

        } else if (call.name === 'add_component') {
          actionType = 'RENDER_HTML';
          const pos = getGridPos(args.gridPosition);
          let html = `<div>${args.componentType}</div>`;
          let configObj: any = undefined;
          let pWidth = 450, pHeight = 400;

          if (args.configJson) {
            try {
              configObj = JSON.parse(args.configJson);
              if (args.componentType === 'DOCUMENT_PAGE' || args.componentType === 'MARKDOWN_NOTE') { pWidth = 650; pHeight = 800; }
            } catch (e) {}
          }

          if (args.componentType === 'CALCULATOR') { html = CALCULATOR_TEMPLATE; pWidth = 350; pHeight = 500; }
          else if (args.componentType === 'TIMER') { html = TIMER_TEMPLATE(configObj?.seconds || 300); pWidth = 300; pHeight = 250; }

          payload = { html, x: pos.x, y: pos.y, width: pWidth, height: pHeight, componentType: args.componentType, config: configObj };

        } else if (call.name === 'pan_camera') {
          actionType = 'PAN_CAMERA';
          payload = { objectId: args.targetObjectId, direction: args.direction };

        } else if (call.name === 'modify_object') {
          if (args.action === 'MOVE_TO_GRID') {
            actionType = 'DRAG_OBJECT';
            const pos = getGridPos(args.value);
            payload = { objectId: args.objectId, toX: pos.x, toY: pos.y };
          } else if (args.action === 'DELETE') {
            actionType = 'DELETE_OBJECT';
            payload = { objectId: args.objectId };
          } else if (args.action === 'UPDATE_TEXT') {
            actionType = 'MODIFY_PROPERTY';
            payload = { objectId: args.objectId, property: 'text', value: args.value };
          } else {
            actionType = 'RESIZE_OBJECT';
          }

        } else if (call.name === 'add_interactive_app') {
          actionType = 'RENDER_HTML';
          const pos = getGridPos(args.gridPosition);
          payload = {
            html: '', x: pos.x, y: pos.y, width: 800, height: 600,
            componentType: 'INTERACTIVE_APP',
            config: { html: args.html || '', css: args.css || '', js: args.js || '', title: args.title || 'Interactive App' }
          };
        }

        if (!actionType) return;
        otherActions.push({ id: `action_${Date.now()}_${index}`, type: actionType, payload, status: 'PENDING' });
      });

      // Stage 4: Enqueue in correct order — shapes first, then connections, then everything else
      [...shapeActions, ...pathActions, ...otherActions].forEach(a => addAction(a));

    } catch (error: any) {
      logger.error('Failed to process prompt', error);

      let errorMsg = 'Sinkronisasi kognitif gagal. Coba lagi atau periksa koneksi AI.';
      if (error instanceof AiServiceError) {
        errorMsg = error.message;
      } else if (error.message?.includes('Ollama Error')) {
        errorMsg = `Kesalahan AI Lokal: ${error.message.replace('Ollama Error: ', '')}`;
        if (error.message.includes('memory')) errorMsg += ' (Sistem kehabisan RAM)';
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
