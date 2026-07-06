import { Type, FunctionDeclaration } from "@google/genai";
import { CanvasObjectData } from "../types";
import { createLogger } from "../utils/logger";

const logger = createLogger('ai-tools');

export interface ViewportBounds {
  width: number;
  height: number;
}

export interface ModelCapability {
  supportsComplexSchema: boolean;
  maxToolCallsPerRequest: number;
  supportsLessonEngine: boolean;
  recommendedTemperature: number;
}

export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  'gemini-3.5-flash-lite': {
    supportsComplexSchema: true,
    maxToolCallsPerRequest: 15,
    supportsLessonEngine: true,
    recommendedTemperature: 0.7
  },
  'gemini-2.0-flash-exp': {
    supportsComplexSchema: true,
    maxToolCallsPerRequest: 15,
    supportsLessonEngine: true,
    recommendedTemperature: 0.7
  },
  'gemma-4-31b-it': {
    supportsComplexSchema: false,
    maxToolCallsPerRequest: 5,
    supportsLessonEngine: false,
    recommendedTemperature: 0.4
  },
  'ollama-local': {
    supportsComplexSchema: false,
    maxToolCallsPerRequest: 3,
    supportsLessonEngine: false,
    recommendedTemperature: 0.3
  }
};

export const getCapability = (modelName: string): ModelCapability => {
  return MODEL_CAPABILITIES[modelName] || MODEL_CAPABILITIES['gemma-4-31b-it'];
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOL DEFINITIONS
// Gemma 4 function calling — keep descriptions precise and concise.
// Required params must always be present; optional ones must be safe to omit.
// ─────────────────────────────────────────────────────────────────────────────
export const tools: FunctionDeclaration[] = [
  {
    name: "add_mindmap_node",
    description: "Add a node to a mind map or concept diagram. Connections are generated automatically from parentNodeText — do NOT call connect_nodes for mind maps.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: "Label text shown inside the node"
        },
        style: {
          type: Type.STRING,
          enum: ["MAIN_TOPIC", "SUBTOPIC", "DETAIL", "HIGHLIGHT"],
          description: "Visual style. MAIN_TOPIC = central concept (use exactly once). SUBTOPIC = main branches. DETAIL = leaf nodes."
        },
        parentNodeText: {
          type: Type.STRING,
          description: "Exact text of the parent node. Omit or set null for the root (MAIN_TOPIC) node only."
        }
      },
      required: ["text", "style"]
    }
  },
  {
    name: "connect_nodes",
    description: "Draw a line or arrow between two existing nodes by their label text.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fromNodeText: {
          type: Type.STRING,
          description: "Exact or partial label of the source node"
        },
        toNodeText: {
          type: Type.STRING,
          description: "Exact or partial label of the destination node"
        },
        lineStyle: {
          type: Type.STRING,
          enum: ["ARROW_STRAIGHT", "ARROW_CURVED", "LINE"],
          description: "Arrow style. Use ARROW_CURVED for organic flow diagrams."
        }
      },
      required: ["fromNodeText", "toNodeText"]
    }
  },
  {
    name: "add_text_label",
    description: "Add standalone text on the canvas — titles, captions, annotations, headings.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "Text content to display" },
        gridPosition: {
          type: Type.STRING,
          enum: [
            "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT",
            "CENTER_LEFT", "CENTER", "CENTER_RIGHT",
            "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"
          ],
          description: "Grid zone on the visible canvas"
        },
        size: {
          type: Type.STRING,
          enum: ["TITLE", "SUBTITLE", "BODY", "CAPTION"],
          description: "Font size preset"
        }
      },
      required: ["text", "gridPosition"]
    }
  },
  {
    name: "pan_camera",
    description: "Move the canvas viewport. Use targetObjectId to navigate to a specific existing object, or direction to pan freely.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetObjectId: {
          type: Type.STRING,
          description: "ID from the EXISTING OBJECTS or INTERACTIVE COMPONENTS list. Used to center the view on that object."
        },
        direction: {
          type: Type.STRING,
          enum: ["UP", "DOWN", "LEFT", "RIGHT"],
          description: "Pan direction relative to current view."
        }
      }
    }
  },
  {
    name: "add_component",
    description: "Add a pre-built interactive educational widget to the canvas. Use this for quizzes, documents, timers, calculators, and flashcards.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        componentType: {
          type: Type.STRING,
          enum: [
            "QUIZ_MULTIPLE_CHOICE",
            "QUIZ_ESSAY",
            "QUIZ_TRUE_FALSE",
            "QUIZ_DRAG_MATCH",
            "FLASHCARD",
            "CALCULATOR",
            "TIMER",
            "MARKDOWN_NOTE",
            "DOCUMENT_PAGE"
          ],
          description: "Widget type to instantiate"
        },
        gridPosition: {
          type: Type.STRING,
          enum: [
            "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT",
            "CENTER_LEFT", "CENTER", "CENTER_RIGHT",
            "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"
          ]
        },
        configJson: {
          type: Type.STRING,
          description: `JSON string configuring the component. Schemas by type:
QUIZ_MULTIPLE_CHOICE: {"question":"string","options":["A","B","C","D"],"correctIndex":0}
QUIZ_ESSAY: {"question":"string","placeholder":"optional hint text"}
QUIZ_TRUE_FALSE: {"statement":"string","isTrue":true}
QUIZ_DRAG_MATCH: {"pairs":[{"left":"term","right":"definition"}]}
FLASHCARD: {"front":"string","back":"string"}
TIMER: {"mode":"TIMER|STOPWATCH|CLOCK|ALARM","seconds":300,"alarmAt":"HH:MM"}
DOCUMENT_PAGE or MARKDOWN_NOTE: {"title":"string","markdown":"# Heading\\n\\nBody text. Math: $E=mc^2$"}`
        }
      },
      required: ["componentType", "gridPosition"]
    }
  },
  {
    name: "update_component",
    description: "Replace the content of an existing interactive widget — use this for 'next question', 'update timer', 'edit note', etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        objectId: {
          type: Type.STRING,
          description: "ID of the existing component from INTERACTIVE COMPONENTS list"
        },
        configJson: {
          type: Type.STRING,
          description: "New JSON configuration — same schema as add_component.configJson for that component type"
        }
      },
      required: ["objectId", "configJson"]
    }
  },
  {
    name: "modify_object",
    description: "Move, rename, or delete an existing canvas shape or text object.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        objectId: {
          type: Type.STRING,
          description: "ID of the object from the EXISTING OBJECTS list"
        },
        action: {
          type: Type.STRING,
          enum: ["MOVE_TO_GRID", "UPDATE_TEXT", "DELETE", "CHANGE_STYLE"],
          description: "Operation to perform"
        },
        value: {
          type: Type.STRING,
          description: "Grid position for MOVE_TO_GRID, new text for UPDATE_TEXT, style enum for CHANGE_STYLE"
        }
      },
      required: ["objectId", "action"]
    }
  },
  {
    name: "add_interactive_app",
    description: "Build and embed a fully custom interactive web application or simulation on the canvas. The AI writes complete HTML/CSS/JS source code. Use for simulations, games, calculators, visualization tools, and any custom UI not covered by add_component.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "App display title shown in its header bar" },
        html: {
          type: Type.STRING,
          description: "Complete body HTML. Tailwind CSS v3 CDN is pre-loaded. Keep code self-contained."
        },
        css: { type: Type.STRING, description: "Additional CSS styles (optional)" },
        js: {
          type: Type.STRING,
          description: "JavaScript for interactivity. Use vanilla JS — no bundler, no imports."
        },
        gridPosition: {
          type: Type.STRING,
          enum: [
            "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT",
            "CENTER_LEFT", "CENTER", "CENTER_RIGHT",
            "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"
          ]
        }
      },
      required: ["title", "html", "gridPosition"]
    }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM INSTRUCTION BUILDER
// ─────────────────────────────────────────────────────────────────────────────
export const buildSystemInstruction = (
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {},
  lessonContext?: {
    subject?: string;
    topic?: string;
    gradeLevel?: string;
    phase?: string;
    existingMindmapNodes?: string[];
    completedSteps?: string[];
  },
  modelCapability?: ModelCapability
): string => {
  const vw = viewport.width;
  const vh = viewport.height;

  // Grid coordinate mapping
  const gridMap = {
    TOP_LEFT:      { x: Math.round(vw * 0.15), y: Math.round(vh * 0.15) },
    TOP_CENTER:    { x: Math.round(vw * 0.50), y: Math.round(vh * 0.15) },
    TOP_RIGHT:     { x: Math.round(vw * 0.85), y: Math.round(vh * 0.15) },
    CENTER_LEFT:   { x: Math.round(vw * 0.15), y: Math.round(vh * 0.50) },
    CENTER:        { x: Math.round(vw * 0.50), y: Math.round(vh * 0.50) },
    CENTER_RIGHT:  { x: Math.round(vw * 0.85), y: Math.round(vh * 0.50) },
    BOTTOM_LEFT:   { x: Math.round(vw * 0.15), y: Math.round(vh * 0.85) },
    BOTTOM_CENTER: { x: Math.round(vw * 0.50), y: Math.round(vh * 0.85) },
    BOTTOM_RIGHT:  { x: Math.round(vw * 0.85), y: Math.round(vh * 0.85) },
  };

  const gridCoords = Object.entries(gridMap)
    .map(([name, c]) => `  ${name}: (${c.x}, ${c.y})`)
    .join('\n');

  // Existing canvas objects
  const existingObjects = canvasObjects.length > 0
    ? canvasObjects
        .map(o => `  - [${o.id}] ${o.type}${o.textContent ? ` "${o.textContent}"` : ''} at (${o.left}, ${o.top})`)
        .join('\n')
    : '  (empty)';

  // DOM components
  const domEntries = Object.entries(domElements)
    .map(([id, el]) => `  - [${id}] ${el.componentType || 'Widget'}`)
    .join('\n') || '  (none)';

  // Lesson context block
  const lessonBlock = lessonContext?.topic
    ? `
## ACTIVE LESSON SESSION
Subject: ${lessonContext.subject || 'General'}
Topic: ${lessonContext.topic}
Grade: ${lessonContext.gradeLevel || 'Unknown'}
Phase: ${lessonContext.phase || 'freeform'}
${lessonContext.existingMindmapNodes?.length 
  ? `Mindmap nodes already on canvas:\n${lessonContext.existingMindmapNodes.map(n => `  - "${n}"`).join('\n')}` 
  : ''}
${lessonContext.completedSteps?.length
  ? `Completed: ${lessonContext.completedSteps.join(', ')}`
  : ''}
`
    : '';
  const capability = modelCapability || MODEL_CAPABILITIES['gemini-3.5-flash-lite'];

  if (!capability.supportsLessonEngine) {
    // SIMPLE MODE untuk model lemah — fewer rules, fewer tools mentioned
    return `You are Trido, a whiteboard assistant.

CANVAS: ${vw}×${vh}px
${existingObjects}

RULES:
- Respond in user's language
- For mind maps: use add_mindmap_node only. First node = MAIN_TOPIC (center), others = SUBTOPIC
- For text: use add_text_label with gridPosition=CENTER
- Keep responses short (1-2 sentences)
- Maximum ${capability.maxToolCallsPerRequest} tool calls

Execute the request now.`;
  }

  return `You are Trido — an AI teaching assistant in a smart digital whiteboard for Indonesian teachers.

## CANVAS STATE
Viewport: ${vw}×${vh}px
Page: ${pageContext ? `${pageContext.current + 1} / ${pageContext.total}` : '1'}

Existing shapes/text:
${existingObjects}

Interactive components:
${domEntries}

## GRID POSITIONS
${gridCoords}
${lessonBlock}

## WHO YOU ARE
You help teachers run entire lessons from one command. You understand:
- Indonesian curriculum and pedagogical structure
- Lesson flow: intro → core content → practice → quiz → closing
- Different subjects need different visuals

## HOW TO RESPOND

### When teacher gives a TOPIC (lesson start):
Detect: "sistem pernapasan", "fotosintesis kelas 8", "matematika persamaan linear", etc.
Action:
1. Generate a lesson plan in your text response
2. Immediately create the FIRST visual (usually a mindmap or title)
3. End with what comes next

Example response text:
"Siap mengajar Sistem Pernapasan untuk kelas 8! 🎓
Saya sudah buat peta konsep dasarnya.

Rencana sesi ini:
✅ Peta konsep organ pernapasan
⏳ Flowchart proses bernapas
⏳ Quiz 5 soal

Ketik 'lanjut' untuk flowchart, atau 'quiz' untuk langsung ke evaluasi."

### When teacher says LANJUT / NEXT / CONTINUE:
Check lesson context → create next planned step

### When teacher asks a QUESTION (apa, bagaimana, mengapa):
Answer in 2-3 sentences → offer to visualize
Example: "Fotosintesis mengubah cahaya matahari menjadi glukosa melalui 2 tahap utama: 
reaksi terang dan siklus Calvin. Mau saya visualisasikan sebagai diagram alur?"

### When teacher says TAMBAH DETAIL / EXPAND:
Use add_mindmap_node with parentNodeText from existing nodes
DO NOT recreate the whole mindmap

### When teacher says QUIZ / SOAL:
Generate quiz based on current lesson topic (not generic)

## VISUAL SELECTION GUIDE
| Request | Use This |
|---------|----------|
| Konsep, hubungan, struktur | add_mindmap_node |
| Proses bertahap, alur, langkah | add_component → DOCUMENT_PAGE with flowchart in markdown |
| Urutan waktu, sejarah | add_component → DOCUMENT_PAGE with timeline |
| Perbandingan 2-3 hal | add_component → MARKDOWN_NOTE with table |
| Penjelasan panjang | add_component → DOCUMENT_PAGE |
| Latihan soal | add_component → QUIZ_* |
| Simulasi/game | add_interactive_app |

## MINDMAP RULES
- MAIN_TOPIC: exactly ONE per mindmap, always center
- SUBTOPIC: branches (max 5)
- DETAIL: leaf nodes (max 3 per subtopic)
- parentNodeText MUST be exact text of existing node
- Never recreate nodes that already exist (check ACTIVE LESSON SESSION)
- To expand: add new nodes with correct parentNodeText

## SUBJECT-SPECIFIC DEFAULTS
IPA/Sains: mindmap untuk konsep, flowchart untuk proses
Matematika: document dengan rumus KaTeX, langkah penyelesaian
IPS/Sejarah: timeline, tabel perbandingan
Bahasa Indonesia: mindmap unsur intrinsik, document struktur teks
Bahasa Inggris: flashcard vocabulary, quiz grammar

## RESPONSE RULES
- Language: Always match teacher's language (Indonesian → respond Indonesian)
- Length: 2-5 sentences in chat
- Tone: Helpful teacher's aide, warm and practical
- Always end with what's available next OR a teaching tip
- NEVER just say "Menjalankan tindakan"
- NEVER dump everything at once — build the lesson incrementally

## CONSTRAINTS
- Max ${capability.maxToolCallsPerRequest} tool calls per response
- Max 5 subtopics per mindmap request
- Max 1 quiz widget per response
- First object always at CENTER
`;
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fixedCalls: any[];
}

export const validateFunctionCalls = (
  calls: any[],
  canvasObjects: CanvasObjectData[],
  domElements: Record<string, any> = {}
): ValidationResult => {
  const errors: string[] = [];
  const fixedCalls: any[] = [];

  for (let index = 0; index < calls.length; index++) {
    const call = calls[index];

    if (!call?.name) {
      errors.push(`Call ${index}: missing tool name`);
      continue;
    }

    const toolDef = tools.find(t => t.name === call.name);
    if (!toolDef) {
      errors.push(`Call ${index}: unknown tool "${call.name}"`);
      continue;
    }

    // Ensure args is always an object
    if (!call.args || typeof call.args !== 'object') {
      errors.push(`Call ${index}: args must be an object`);
      continue;
    }

    // Check required parameters
    const missing = (toolDef.parameters?.required || []).filter(
      req => !(req in call.args) || call.args[req] === null || call.args[req] === undefined
    );
    if (missing.length > 0) {
      errors.push(`Call ${index} (${call.name}): missing required params: ${missing.join(', ')}`);
      continue;
    }

    // Validate objectId for modify / update operations
    if (call.name === 'modify_object') {
      const id = call.args.objectId;
      const validIds = canvasObjects.map(o => o.id);
      if (id && !validIds.includes(id)) {
        errors.push(`Call ${index}: modify_object ID "${id}" not found on canvas`);
        continue;
      }
    }

    if (call.name === 'update_component') {
      const id = call.args.objectId;
      const validIds = Object.keys(domElements);
      if (id && validIds.length > 0 && !validIds.includes(id)) {
        errors.push(`Call ${index}: update_component ID "${id}" not in DOM elements`);
        continue;
      }
      // Safely parse configJson
      if (call.args.configJson && typeof call.args.configJson === 'string') {
        try {
          JSON.parse(call.args.configJson);
        } catch {
          errors.push(`Call ${index}: update_component.configJson is not valid JSON`);
          continue;
        }
      }
    }

    if (call.name === 'add_component' && call.args.configJson) {
      if (typeof call.args.configJson === 'string') {
        try {
          JSON.parse(call.args.configJson);
        } catch {
          errors.push(`Call ${index}: add_component.configJson is not valid JSON`);
          continue;
        }
      }
    }

    fixedCalls.push(call);
  }

  return { isValid: errors.length === 0, errors, fixedCalls };
};

// ─────────────────────────────────────────────────────────────────────────────
// THINKING EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────
export const extractThinking = (response: any): string => {
  if (response?.thought) return response.thought;

  try {
    const parts = response?.candidates?.[0]?.content?.parts || [];
    const thoughtPart = parts.find((p: any) => p.thought === true || p.type === 'thinking');
    if (thoughtPart?.text) return thoughtPart.text;
  } catch (e) {
    logger.warn('Failed to extract structured thinking', e);
  }

  const text = response?.text || response?.content || '';
  const patterns = [
    /<thought>(.*?)<\/thought>/s,
    /```thinking\n(.*?)\n```/s,
    /\[THINKING\](.*?)\[\/THINKING\]/s,
    /<think>(.*?)<\/think>/s,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
};
