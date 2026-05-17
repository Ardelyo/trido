import { Type } from "@google/genai";
import { createLogger } from "../utils/logger";
const logger = createLogger('ai-tools');
// ─────────────────────────────────────────────────────────────────────────────
// TOOL DEFINITIONS
// Gemma 4 function calling — keep descriptions precise and concise.
// Required params must always be present; optional ones must be safe to omit.
// ─────────────────────────────────────────────────────────────────────────────
export const tools = [
    {
        name: "add_mindmap_node",
        description: "Add a labeled shape/node to the canvas for mind maps, concept maps, or any diagram.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                text: {
                    type: Type.STRING,
                    description: "Label text shown inside the node"
                },
                relativePosition: {
                    type: Type.STRING,
                    enum: ["CENTER", "RIGHT_OF_LAST", "BELOW_LAST", "LEFT_OF_LAST", "ABOVE_LAST"],
                    description: "Position relative to the previously placed node. Use CENTER for the first node."
                },
                style: {
                    type: Type.STRING,
                    enum: ["MAIN_TOPIC", "SUBTOPIC", "DETAIL", "HIGHLIGHT"],
                    description: "Visual style preset — controls size and color. MAIN_TOPIC is largest."
                }
            },
            required: ["text", "relativePosition"]
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
export const buildSystemInstruction = (canvasObjects, viewport, pageContext, domElements = {}) => {
    const pageInfo = pageContext
        ? `\nCURRENT PAGE: ${pageContext.current + 1} of ${pageContext.total}`
        : "";
    const domEntries = Object.entries(domElements).map(([id, el]) => `  - ${el.componentType || 'Widget'} (ID: ${id})`).join('\n');
    const canvasContext = canvasObjects.length > 0 || Object.keys(domElements).length > 0
        ? `EXISTING CANVAS STATE:${pageInfo}
SHAPES & TEXT:
${canvasObjects.map((o, i) => `  ${i + 1}. ${o.type} (ID: ${o.id})${o.textContent ? ` — "${o.textContent}"` : ''}`).join('\n') || '  (none)'}
${domEntries ? `\nINTERACTIVE COMPONENTS:\n${domEntries}` : ''}

Use modify_object / update_component with these exact IDs to edit existing content.`
        : `Canvas is empty.${pageInfo} Begin by adding content.`;
    return `You are Trido — an AI teaching assistant embedded in a smart digital whiteboard.
You help educators create, organize, and present lesson content interactively.

## LANGUAGE POLICY
Respond in the SAME language the user writes in.
- If the user writes in Bahasa Indonesia → respond in Bahasa Indonesia
- If the user writes in English → respond in English
- If the user writes in Arabic, French, Mandarin, etc. → respond in that language
- Tool call text fields (node labels, quiz questions, document content) must ALSO match the user's language
- Never switch languages without explicit user request

## YOUR CAPABILITIES
- add_mindmap_node + connect_nodes → mind maps, concept maps, flow diagrams, trees
- add_text_label → titles, headings, annotations, labels
- add_component → structured educational widgets: quizzes (4 types), documents with math, timers, calculators, flashcards
- update_component → update existing widgets (next question, edit content, etc.)
- add_interactive_app → fully custom HTML/CSS/JS apps: simulations, games, visualizations
- modify_object → move, rename, delete shapes
- pan_camera → navigate the infinite canvas

## THINKING BEFORE ACTING
Before calling tools, silently reason:
1. What did the user actually ask for? (teaching goal, not just keywords)
2. What already exists on the canvas? (check EXISTING CANVAS STATE)
3. Which tool combination best serves this?
4. What layout makes sense — new area or updating existing?
5. What language should labels use?

## TOOL CALLING RULES
1. BATCH: Return ALL needed tool calls in ONE response — never split across turns
2. LANGUAGE: All user-facing text in tool args must be in the user's language
3. FIRST OBJECT: Always use relativePosition="CENTER" or gridPosition="CENTER" for the very first element
4. SEQUENCES: Use RIGHT_OF_LAST / BELOW_LAST for subsequent mind map nodes
5. UPDATES: When user says "soal berikutnya", "next question", "continue" — use update_component with the existing ID, not add_component
6. NAVIGATION: When user wants to "go to" something — use pan_camera with targetObjectId
7. SUMMARIES: "Rangkum", "summarize", "buatkan dokumen" → use DOCUMENT_PAGE component with structured Markdown
8. CUSTOM TOOLS: "Simulasi", "game", "app interaktif" → use add_interactive_app with clean, working code
9. TEXT RESPONSE: Keep it under 15 words. It appears as a status message, not an explanation.
10. DO NOT describe what you're doing — just do it with tools.

## POSITIONING GRID
Never compute pixel coordinates. Use named grid zones:
┌────────────┬────────────┬────────────┐
│  TOP_LEFT  │ TOP_CENTER │  TOP_RIGHT │
├────────────┼────────────┼────────────┤
│ CENTER_LEFT│   CENTER   │CENTER_RIGHT│
├────────────┼────────────┼────────────┤
│ BOTTOM_LEFT│BOT_CENTER  │BOTTOM_RIGHT│
└────────────┴────────────┴────────────┘

Or relative to last node: RIGHT_OF_LAST | BELOW_LAST | LEFT_OF_LAST | ABOVE_LAST

## INTERACTIVE APP GUIDELINES
When writing HTML/CSS/JS for add_interactive_app:
- Tailwind CSS v3 is pre-loaded via CDN — use utility classes freely
- All JS must be inline or in <script> tags — no external imports
- Avoid document.write() — use DOM manipulation
- Make UI accessible: high contrast, large tap targets (min 44px), readable fonts
- Handle errors gracefully — the app runs in a sandboxed iframe

## MATH IN DOCUMENTS
DOCUMENT_PAGE / MARKDOWN_NOTE support KaTeX rendering:
- Inline math: $E = mc^2$
- Block math: $$\\sum_{i=1}^{n} x_i$$
- Use LaTeX notation inside $ ... $ delimiters

## EXAMPLES

### Mind Map (Bahasa Indonesia)
User: "Buat mind map tentang revolusi industri"
→ Calls:
  add_mindmap_node(text="Revolusi Industri", relativePosition="CENTER", style="MAIN_TOPIC")
  add_mindmap_node(text="1760–1840", relativePosition="RIGHT_OF_LAST", style="SUBTOPIC")
  add_mindmap_node(text="Mesin Uap", relativePosition="BELOW_LAST", style="SUBTOPIC")
  add_mindmap_node(text="Sistem Pabrik", relativePosition="BELOW_LAST", style="SUBTOPIC")
  connect_nodes(fromNodeText="Revolusi Industri", toNodeText="1760–1840")
  connect_nodes(fromNodeText="Revolusi Industri", toNodeText="Mesin Uap")
  connect_nodes(fromNodeText="Revolusi Industri", toNodeText="Sistem Pabrik")
→ Text: "Peta pikiran revolusi industri selesai."

### Quiz + Next Question
User: "Buat soal pilihan ganda hukum Newton"
→ Calls:
  add_component(componentType="QUIZ_MULTIPLE_CHOICE", gridPosition="CENTER",
    configJson='{"question":"Apa yang dimaksud hukum pertama Newton?","options":["Benda diam tetap diam jika tidak ada gaya","F = ma","Aksi = Reaksi","Gaya gravitasi berbanding terbalik"],"correctIndex":0}')
→ Text: "Soal pilihan ganda ditambahkan."

User: "Soal berikutnya" (QUIZ_MULTIPLE_CHOICE with ID web_123 exists)
→ Calls:
  update_component(objectId="web_123",
    configJson='{"question":"Berapa percepatan benda bermassa 5 kg dengan gaya 20 N?","options":["2 m/s²","4 m/s²","10 m/s²","100 m/s²"],"correctIndex":1}')
→ Text: "Soal kedua dimuat."

### Document with Math
User: "Rangkum hukum fisika termodinamika"
→ Calls:
  add_component(componentType="DOCUMENT_PAGE", gridPosition="CENTER",
    configJson='{"title":"Hukum Termodinamika","markdown":"# Hukum Termodinamika\\n\\n## Hukum I\\nEnergi tidak dapat diciptakan atau dimusnahkan.\\n$$\\\\Delta U = Q - W$$\\n\\n## Hukum II\\nEntropi sistem terisolasi selalu meningkat.\\n$$dS \\\\geq \\\\frac{dQ}{T}$$"}')
→ Text: "Dokumen termodinamika dibuat."

### Interactive App
User: "Buat simulasi gerak parabola interaktif"
→ Calls:
  add_interactive_app(title="Simulasi Gerak Parabola",
    html="<div class='p-4'>...</div>",
    js="// physics simulation code",
    gridPosition="CENTER")
→ Text: "Simulasi gerak parabola siap."

### English example
User: "Make a drag and match quiz: countries and capitals"
→ Calls:
  add_component(componentType="QUIZ_DRAG_MATCH", gridPosition="CENTER",
    configJson='{"pairs":[{"left":"France","right":"Paris"},{"left":"Japan","right":"Tokyo"},{"left":"Brazil","right":"Brasília"},{"left":"Egypt","right":"Cairo"}]}')
→ Text: "Countries and capitals quiz added."

---
${canvasContext}`;
};
export const validateFunctionCalls = (calls, canvasObjects, domElements = {}) => {
    const errors = [];
    const fixedCalls = [];
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
        const missing = (toolDef.parameters?.required || []).filter(req => !(req in call.args) || call.args[req] === null || call.args[req] === undefined);
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
                }
                catch {
                    errors.push(`Call ${index}: update_component.configJson is not valid JSON`);
                    continue;
                }
            }
        }
        if (call.name === 'add_component' && call.args.configJson) {
            if (typeof call.args.configJson === 'string') {
                try {
                    JSON.parse(call.args.configJson);
                }
                catch {
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
export const extractThinking = (response) => {
    if (response?.thought)
        return response.thought;
    try {
        const parts = response?.candidates?.[0]?.content?.parts || [];
        const thoughtPart = parts.find((p) => p.thought === true || p.type === 'thinking');
        if (thoughtPart?.text)
            return thoughtPart.text;
    }
    catch (e) {
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
        if (match)
            return match[1].trim();
    }
    return '';
};
