import React, { useCallback } from 'react';
import { useStore } from '../store';
import { AiServiceError, generateAgentActions } from '../services/aiService';
import { Point, CanvasObjectData, AgentAction, LessonPlan } from '../types';
import { CALCULATOR_TEMPLATE, TIMER_TEMPLATE } from '../services/componentTemplates';
import { createLogger } from '../utils/logger';
import { sounds } from '../utils/sounds';
import { layoutMindmap, NODE_STYLE_CONFIG, MindmapInputNode } from '../utils/mindmapLayout';

const logger = createLogger('gemini-brain');

// Global request lock to prevent overlapping calls across instances
let isProcessingGlobal = false;

// ============================================================================
// SYNTHESIZED FALLBACK TEXT (tidak bergantung pada model)
// ============================================================================
const synthesizeFallbackResponse = (
  functionCalls: any[],
  lessonPlan: LessonPlan | null
): string => {
  if (functionCalls.length === 0) {
    return 'Baik, ada yang bisa saya bantu?';
  }

  const toolNames = functionCalls.map(c => c.name);
  const mindmapCount = functionCalls.filter(c => c.name === 'add_mindmap_node').length;
  const hasQuiz = functionCalls.some(c => 
    c.name === 'add_component' && 
    String(c.args?.componentType || '').startsWith('QUIZ')
  );
  const hasDocument = functionCalls.some(c => 
    c.name === 'add_component' && 
    ['DOCUMENT_PAGE', 'MARKDOWN_NOTE'].includes(c.args?.componentType)
  );
  const hasApp = toolNames.includes('add_interactive_app');
  const topic = lessonPlan?.topic || '';

  if (mindmapCount > 0) {
    return `Peta konsep${topic ? ` ${topic}` : ''} sudah ${mindmapCount > 3 ? 'dibuat' : 'diperbarui'} dengan ${mindmapCount} elemen. Ketik "lanjut" untuk materi berikutnya, atau minta detail tambahan pada bagian tertentu.`;
  }
  if (hasQuiz) {
    return `Soal latihan${topic ? ` tentang ${topic}` : ''} sudah siap di papan! Beri waktu murid mengerjakan, lalu kita bahas bersama.`;
  }
  if (hasDocument) {
    return `Materi${topic ? ` ${topic}` : ''} sudah saya siapkan di papan. Mau saya tambahkan quiz untuk latihan?`;
  }
  if (hasApp) {
    return 'Aplikasi interaktif sudah ditambahkan ke papan. Coba klik dan jelajahi bersama murid.';
  }
  return 'Sudah selesai dikerjakan di papan!';
};

// ============================================================================
// TOOL CALL VALIDATION & AUTO-CORRECTION
// ============================================================================
interface ToolCallError {
  tool: string;
  error: string;
  suggestedFix?: any;
}

const validateAndFixToolCall = (call: any): { valid: boolean; fixed?: any; error?: string } => {
  const args = call.args || {};
  switch (call.name) {
    case 'add_mindmap_node':
      if (!args.text) {
        return {
          valid: false,
          error: 'Missing required field: text',
          fixed: { ...args, text: 'Node baru' }
        };
      }
      // ✅ FIX: Match exactly what aiTools.ts defines
      const validStyles = ['MAIN_TOPIC', 'SUBTOPIC', 'DETAIL', 'HIGHLIGHT'];
      if (args.style && !validStyles.includes(args.style)) {
        return {
          valid: false,
          error: `Invalid style: ${args.style}`,
          fixed: { 
            ...args, 
            // Smart fallback based on whether it has a parent
            style: args.parentNodeText ? 'SUBTOPIC' : 'MAIN_TOPIC'
          }
        };
      }
      return { valid: true };

    case 'add_component':
      if (!args.componentType) {
        return {
          valid: false,
          error: 'Missing componentType',
          fixed: { ...args, componentType: 'MARKDOWN_NOTE' }
        };
      }
      if (args.configJson) {
        try {
          JSON.parse(args.configJson);
        } catch (_) {
          return {
            valid: false,
            error: 'Invalid configJson string',
            fixed: { ...args, configJson: '{}' }
          };
        }
      }
      return { valid: true };

    case 'modify_object':
      if (!args.objectId) {
        return {
          valid: false,
          error: 'Missing objectId for modify_object',
          fixed: null
        };
      }
      const validActions = ['MOVE_TO_GRID', 'DELETE', 'UPDATE_TEXT', 'RESIZE_OBJECT'];
      if (!args.action || !validActions.includes(args.action)) {
        return {
          valid: false,
          error: `Invalid action: ${args.action}`,
          fixed: { ...args, action: 'MOVE_TO_GRID', value: 'CENTER' }
        };
      }
      return { valid: true };

    case 'add_interactive_app':
      if (!args.html && !args.js) {
        return {
          valid: false,
          error: 'Empty interactive app code',
          fixed: { ...args, html: '<h3>Aplikasi Kustom</h3>' }
        };
      }
      return { valid: true };

    case 'add_text_label':
      if (!args.text) {
        return {
          valid: false,
          error: 'Missing text in add_text_label',
          fixed: { ...args, text: 'Label' }
        };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
};

const classifyIntent = (prompt: string): 'question' | 'creation' | 'modification' | 'navigation' => {
  const questionWords = /^(apa|bagaimana|mengapa|kapan|siapa|berapa|what|how|why|when|who|jelaskan|explain)/i;
  const creationWords = /buat|create|gambar|draw|tambah|add|tulis|write|bikin|generate/i;
  const modificationWords = /ubah|edit|hapus|delete|pindah|move|update|ganti|change/i;
  const navigationWords = /pergi|go|zoom|pan|navigasi|navigate|ke halaman|page/i;

  if (questionWords.test(prompt.trim())) return 'question';
  if (creationWords.test(prompt)) return 'creation';
  if (modificationWords.test(prompt)) return 'modification';
  if (navigationWords.test(prompt)) return 'navigation';
  return 'creation'; // default
};

interface ParsedLesson {
  isLessonStart: boolean;
  subject?: string;
  topic?: string;
  gradeLevel?: string;
}

const detectLessonStart = (prompt: string): ParsedLesson => {
  const subjectMap: Record<string, string> = {
    'ipa': 'IPA', 'biologi': 'IPA Biologi', 'fisika': 'IPA Fisika',
    'kimia': 'IPA Kimia', 'matematika': 'Matematika', 'mtk': 'Matematika',
    'ips': 'IPS', 'sejarah': 'IPS Sejarah', 'geografi': 'IPS Geografi',
    'bahasa indonesia': 'Bahasa Indonesia', 'b.indo': 'Bahasa Indonesia',
    'bahasa inggris': 'Bahasa Inggris', 'english': 'Bahasa Inggris',
    'pkn': 'PKN', 'agama': 'Pendidikan Agama', 'seni': 'Seni Budaya',
    'penjaskes': 'PJOK', 'olahraga': 'PJOK'
  };
  
  const gradePattern = /kelas\s*(\d+[a-zA-Z]?)|grade\s*(\d+)|sd|smp|sma/i;
  const lessonStartWords = /^(hari ini|materi|topik|belajar|ajar|teach|today|lesson about)/i;
  const subjectPattern = new RegExp(Object.keys(subjectMap).join('|'), 'i');
  
  const hasLessonStart = lessonStartWords.test(prompt.trim());
  const hasSubject = subjectPattern.test(prompt);
  const gradeMatch = prompt.match(gradePattern);
  
  if (!hasLessonStart && !hasSubject) {
    return { isLessonStart: false };
  }
  
  // Extract subject
  let detectedSubject = 'Umum';
  for (const [key, value] of Object.entries(subjectMap)) {
    if (prompt.toLowerCase().includes(key)) {
      detectedSubject = value;
      break;
    }
  }
  
  // Extract grade
  let detectedGrade = '';
  if (gradeMatch) {
    detectedGrade = `Kelas ${gradeMatch[1] || gradeMatch[2] || ''}`.trim();
    if (prompt.toLowerCase().includes('sd')) detectedGrade += ' SD';
    if (prompt.toLowerCase().includes('smp')) detectedGrade += ' SMP';
    if (prompt.toLowerCase().includes('sma')) detectedGrade += ' SMA';
  }
  
  // Extract topic (remove subject and grade words)
  let topic = prompt
    .replace(subjectPattern, '')
    .replace(gradePattern, '')
    .replace(lessonStartWords, '')
    .replace(/kelas|hari ini|materi|topik|untuk/gi, '')
    .trim();
  
  if (!topic) topic = prompt;
  
  return {
    isLessonStart: true,
    subject: detectedSubject,
    topic,
    gradeLevel: detectedGrade || 'Tidak ditentukan'
  };
};

export const useGeminiBrain = () => {
  const { setThinking, addAction, addLog, addMessage, setAgentMessage } = useStore();
  const isProcessingRef = React.useRef(false); // Ref Lock

  const processUserPrompt = useCallback(async (
    prompt: string,
    canvasRef: React.MutableRefObject<any>
  ) => {
    // Lock guard to prevent concurrent requests
    if (isProcessingGlobal || isProcessingRef.current) {
      addLog('Permintaan sebelumnya masih diproses, mohon tunggu.');
      addMessage({ 
        role: 'model', 
        text: 'Tunggu sebentar, saya masih menyelesaikan permintaan sebelumnya...' 
      });
      return;
    }

    isProcessingGlobal = true;
    isProcessingRef.current = true;

    if (!canvasRef.current) {
      isProcessingGlobal = false;
      isProcessingRef.current = false;
      return;
    }
    const canvas = canvasRef.current;
    const storeState = useStore.getState();

    setThinking(true);
    sounds.play('thinking');
    addLog(`Pemindaian neural dimulai...`);

    const lessonDetection = detectLessonStart(prompt);
    if (lessonDetection.isLessonStart) {
      storeState.startLesson(
        lessonDetection.subject!,
        lessonDetection.topic!,
        lessonDetection.gradeLevel!
      );
      addLog(`📚 Lesson started: ${lessonDetection.subject} - ${lessonDetection.topic}`);
    }

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
      const intent = classifyIntent(prompt);
      const currentStoreState = useStore.getState();
      const { lessonPlan, activeMindmapNodes } = currentStoreState;

      // Build lesson context string
      const lessonContextStr = lessonPlan 
        ? `
LESSON CONTEXT:
- Subject: ${lessonPlan.subject}
- Topic: ${lessonPlan.topic}  
- Grade: ${lessonPlan.gradeLevel}
- Current Phase: ${lessonPlan.phase}
- Completed: ${lessonPlan.completedSteps.length} steps done
`
        : '';

      // Build existing mindmap context
      const mindmapContextStr = activeMindmapNodes.length > 0
        ? `
EXISTING MINDMAP NODES (DO NOT RECREATE THESE):
${activeMindmapNodes.map(n => 
  `- "${n.text}" (${n.style})${n.parentNodeText ? ` → child of "${n.parentNodeText}"` : ' → ROOT'}`
).join('\n')}

To EXPAND this mindmap: use add_mindmap_node with parentNodeText matching exactly one of the above.
To CREATE NEW mindmap: these nodes will be cleared first.
`
        : '';

      const enrichedPrompt = `
${lessonContextStr}
${mindmapContextStr}
[USER INTENT: ${intent.toUpperCase()}]
[USER MESSAGE]: ${prompt}
`.trim();

      const forceTools = intent === 'creation' || intent === 'modification';

      const lessonContextObj = lessonPlan ? {
        subject: lessonPlan.subject,
        topic: lessonPlan.topic,
        gradeLevel: lessonPlan.gradeLevel,
        phase: lessonPlan.phase,
        existingMindmapNodes: activeMindmapNodes.map(n => n.text),
        completedSteps: lessonPlan.completedSteps
      } : undefined;

      const _aiResult = await generateAgentActions(
        enrichedPrompt,
        dataUrl,
        objectsJson,
        { width: br.x - tl.x, height: br.y - tl.y },
        storeState.lastUploadedImage,
        storeState.messages.slice(-8).map(m => ({ role: m.role, text: m.text })),
        { current: storeState.currentPageIndex, total: storeState.pages.length },
        storeState.domElements,
        intent,
        forceTools,
        lessonContextObj
      );
      let functionCalls = _aiResult.functionCalls;
      const { textResponse, thought } = _aiResult;

      if (thought) addLog(`AI Thoughts: ${thought}`);
      useStore.getState().setLastUploadedImage(null);

      const msg = textResponse?.trim() || synthesizeFallbackResponse(functionCalls, storeState.lessonPlan);
      addMessage({ role: 'model', text: msg });
      setAgentMessage(msg);

      // --- 4. POST-PROCESSING PIPELINE ---

      // Stage 0: Validation & Auto-Correction
      const errors: ToolCallError[] = [];
      functionCalls = functionCalls.map((call: any) => {
        const validation = validateAndFixToolCall(call);
        if (!validation.valid) {
          errors.push({
            tool: call.name,
            error: validation.error!,
            suggestedFix: validation.fixed
          });
          logger.warn(`⚠️ AI tool call auto-corrected: ${call.name}`, {
            original: call.args,
            fixed: validation.fixed,
            reason: validation.error
          });
          if (validation.fixed) {
            return { ...call, args: validation.fixed };
          }
        }
        return call;
      }).filter(Boolean);

      if (errors.length > 0) {
        addLog(`Auto-corrected ${errors.length} AI argument errors.`);
      }

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
      let connectCalls = functionCalls.filter(c => c.name === 'connect_nodes');

      // 🛑 HARD RULE: Jika ada mindmap, buang SEMUA connect_nodes
      // (koneksi mindmap sudah auto-generate dari parentNodeText)
      if (mindmapCalls.length > 0 && connectCalls.length > 0) {
        logger.warn(`[Safety] Dropped ${connectCalls.length} connect_nodes calls (mindmap present, connections auto-generated)`);
        connectCalls = [];
      }

      // 🛑 Validasi tambahan: buang connect_nodes dengan garbage values
      connectCalls = connectCalls.filter(c => {
        const from = c.args?.fromNodeText || '';
        const to = c.args?.toNodeText || '';
        const garbageValues = ['MAIN_TOPIC', 'SUBTOPIC', 'DETAIL', 'HIGHLIGHT', 'root', '//root//', ''];
        
        const isGarbage = garbageValues.some(g => 
          from.toUpperCase() === g.toUpperCase() || to.toUpperCase() === g.toUpperCase()
        );
        
        if (isGarbage) {
          logger.warn(`[Safety] Rejected garbage connect_nodes call: "${from}" -> "${to}"`);
          return false;
        }
        return true;
      });

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
        const storeState = useStore.getState();
        
        // ── Get existing mindmap nodes dari registry ───────────────────────
        const existingNodes = storeState.activeMindmapNodes;
        const isExpanding = existingNodes.length > 0;
        
        // ── Build input nodes, merge dengan existing ───────────────────────
        const inputNodes: MindmapInputNode[] = mindmapCalls.map(c => ({
          text: c.args.text,
          style: (c.args.style || 'SUBTOPIC') as MindmapInputNode['style'],
          parentNodeText: c.args.parentNodeText || null,
        }));

        if (isExpanding) {
          // EXPAND MODE: Hitung posisi hanya untuk new nodes
          // Existing nodes tetap di posisi mereka
          
          logger.info(`[MindMap] Expanding existing mindmap: ${existingNodes.length} existing + ${inputNodes.length} new`);
          
          // Cari parent node position dari registry
          const newNodeActions: AgentAction[] = [];
          const newPathActions: AgentAction[] = [];
          
          inputNodes.forEach((newNode, idx) => {
            // Find parent position
            const parentRecord = newNode.parentNodeText 
              ? storeState.getMindmapNodeByText(newNode.parentNodeText)
              : null;
            
            // Calculate offset position from parent
            let newX: number;
            let newY: number;
            
            if (parentRecord) {
              // Place new node relative to parent
              // Count existing children of this parent
              const existingChildren = existingNodes.filter(
                n => n.parentNodeText?.toLowerCase() === parentRecord.text.toLowerCase()
              );
              
              const childCount = existingChildren.length + idx;
              const angleStep = Math.PI / 6; // 30 degrees between siblings
              const baseAngle = -Math.PI / 3; // Start angle
              const radius = newNode.style === 'DETAIL' ? 140 : 200;
              
              // Find parent's own angle from center to distribute children outward
              const parentAngle = Math.atan2(
                parentRecord.y - centerY, 
                parentRecord.x - centerX
              );
              
              const childAngle = parentAngle + baseAngle + (childCount * angleStep);
              newX = parentRecord.x + radius * Math.cos(childAngle);
              newY = parentRecord.y + radius * Math.sin(childAngle);
            } else {
              // No parent found: place near center with offset
              const angle = (idx / inputNodes.length) * Math.PI * 2;
              newX = centerX + 250 * Math.cos(angle);
              newY = centerY + 250 * Math.sin(angle);
            }
            
            const s = NODE_STYLE_CONFIG[newNode.style] || NODE_STYLE_CONFIG.SUBTOPIC;
            const nodeId = `mm_${Date.now()}_${idx}`;
            
            newNodeActions.push({
              id: `action_mm_expand_${Date.now()}_${idx}`,
              type: 'CREATE_SHAPE',
              payload: {
                shapeType: 'RECTANGLE',
                x: newX, y: newY,
                text: newNode.text,
                fill: s.fill,
                width: s.width,
                height: s.height,
                textColor: '#FFFFFF',
                nodeId, // Pass ID for registration
              },
              status: 'PENDING'
            });
            
            // Register new node in store
            storeState.registerMindmapNode({
              text: newNode.text,
              style: newNode.style as any,
              parentNodeText: newNode.parentNodeText,
              canvasObjectId: nodeId,
              x: newX,
              y: newY
            });
            
            // Connection to parent
            if (newNode.parentNodeText) {
              newPathActions.push({
                id: `action_conn_expand_${Date.now()}_${idx}`,
                type: 'DRAW_PATH',
                payload: { 
                  fromNodeText: newNode.parentNodeText, 
                  toNodeText: newNode.text, 
                  lineStyle: 'ARROW_STRAIGHT' 
                },
                status: 'PENDING'
              });
            }
          });
          
          shapeActions.push(...newNodeActions);
          pathActions.push(...newPathActions);
          
        } else {
          // FRESH MODE: Layout engine untuk mindmap baru
          const laid = layoutMindmap(inputNodes, centerX, centerY);
          
          laid.forEach((node, idx) => {
            const s = NODE_STYLE_CONFIG[node.style] || NODE_STYLE_CONFIG.SUBTOPIC;
            const nodeId = `mm_${Date.now()}_${idx}`;
            
            shapeActions.push({
              id: `action_mm_${Date.now()}_${idx}`,
              type: 'CREATE_SHAPE',
              payload: {
                shapeType: 'RECTANGLE',
                x: node.x, y: node.y,
                text: node.text,
                fill: s.fill,
                width: s.width,
                height: s.height,
                textColor: '#FFFFFF',
                nodeId,
              },
              status: 'PENDING'
            });
            
            // Register semua nodes ke store untuk expand nanti
            storeState.registerMindmapNode({
              text: node.text,
              style: node.style as any,
              parentNodeText: node.parentNodeText,
              canvasObjectId: nodeId,
              x: node.x,
              y: node.y
            });
            
            // Auto-generate connection
            if (node.parentNodeText) {
              pathActions.push({
                id: `action_conn_${Date.now()}_${idx}`,
                type: 'DRAW_PATH',
                payload: { 
                  fromNodeText: node.parentNodeText, 
                  toNodeText: node.text, 
                  lineStyle: 'ARROW_STRAIGHT' 
                },
                status: 'PENDING'
              });
            }
          });

          logger.info(`[MindMap] Fresh layout: ${laid.length} nodes, ${pathActions.length} connections`);
        }
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
      isProcessingGlobal = false;
      isProcessingRef.current = false;
    }
  }, [setThinking, addAction, addLog, addMessage, setAgentMessage]);

  return { processUserPrompt, isProcessing: () => isProcessingGlobal || isProcessingRef.current };
};
