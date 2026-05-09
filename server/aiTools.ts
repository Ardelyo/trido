import { Type, FunctionDeclaration } from "@google/genai";
import { CanvasObjectData } from "../types";
import { createLogger } from "../utils/logger";

const logger = createLogger('ai-tools');

export interface ViewportBounds {
  width: number;
  height: number;
}

// OPTIMIZED TOOL DEFINITIONS (Small Model Friendly)
export const tools: FunctionDeclaration[] = [
  {
    name: "add_mindmap_node",
    description: "Add a labeled shape to canvas. Backend handles positioning.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { 
          type: Type.STRING, 
          description: "Label text inside the node" 
        },
        relativePosition: { 
          type: Type.STRING,
          enum: ["CENTER", "RIGHT_OF_LAST", "BELOW_LAST", "LEFT_OF_LAST", "ABOVE_LAST"],
          description: "Automatic positioning relative to previous node"
        },
        style: {
          type: Type.STRING,
          enum: ["MAIN_TOPIC", "SUBTOPIC", "DETAIL", "HIGHLIGHT"],
          description: "Visual style preset (controls size, color, shape)"
        }
      },
      required: ["text", "relativePosition"]
    }
  },
  {
    name: "connect_nodes",
    description: "Draw arrow/line between two existing nodes",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fromNodeText: { 
          type: Type.STRING,
          description: "Text label of the source node" 
        },
        toNodeText: { 
          type: Type.STRING,
          description: "Text label of the target node" 
        },
        lineStyle: {
          type: Type.STRING,
          enum: ["ARROW_STRAIGHT", "ARROW_CURVED", "LINE"],
          description: "Connector visual style"
        }
      },
      required: ["fromNodeText", "toNodeText"]
    }
  },
  {
    name: "add_text_label",
    description: "Add standalone text (not inside a shape)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        gridPosition: {
          type: Type.STRING,
          enum: [
            "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT",
            "CENTER_LEFT", "CENTER", "CENTER_RIGHT",
            "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"
          ]
        },
        size: {
          type: Type.STRING,
          enum: ["TITLE", "SUBTITLE", "BODY", "CAPTION"],
          description: "Text size preset"
        }
      },
      required: ["text", "gridPosition"]
    }
  },
  {
    name: "pan_camera",
    description: "Pan the smartboard camera viewport. To navigate to an existing object, provide its ID. To pan manually, provide a direction.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetObjectId: {
          type: Type.STRING,
          description: "ID of the object to focus on (e.g., from EXISTING OBJECTS list). Use this to navigate back to previously created content."
        },
        direction: {
          type: Type.STRING,
          enum: ["UP", "DOWN", "LEFT", "RIGHT"],
          description: "Pan direction. UP means looking higher on the board."
        }
      }
    }
  },
  {
    name: "add_component",
    description: "Add pre-built interactive educational component",
    parameters: {
      type: Type.OBJECT,
      properties: {
        componentType: {
          type: Type.STRING,
          enum: ["QUIZ_MULTIPLE_CHOICE", "QUIZ_ESSAY", "QUIZ_TRUE_FALSE", "QUIZ_DRAG_MATCH", "FLASHCARD", "CALCULATOR", "TIMER", "CHECKLIST", "MARKDOWN_NOTE", "DOCUMENT_PAGE"]
        },
        gridPosition: {
          type: Type.STRING,
          enum: ["TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"]
        },
        configJson: {
          type: Type.STRING,
          description: "JSON string with component settings. For QUIZ_MULTIPLE_CHOICE: {\"question\": \"text\", \"options\": [\"A\",\"B\",\"C\"], \"correctIndex\": 0}, QUIZ_ESSAY: {\"question\": \"text\", \"placeholder\": \"text\"}, QUIZ_TRUE_FALSE: {\"statement\": \"text\", \"isTrue\": true}, QUIZ_DRAG_MATCH: {\"pairs\": [{\"left\": \"text\", \"right\": \"text\"}]}, DOCUMENT_PAGE/MARKDOWN_NOTE: {\"title\": \"string\", \"markdown\": \"string supports math and formulas\"}, TIMER: {\"mode\": \"TIMER|STOPWATCH|CLOCK|ALARM\", \"seconds\": 300, \"alarmAt\": \"HH:MM\"}"
        }
      },
      required: ["componentType", "gridPosition"]
    }
  },
  {
    name: "update_component",
    description: "Update content of an existing interactive component (e.g., next quiz question)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        objectId: { 
          type: Type.STRING,
          description: "ID of the existing component to update" 
        },
        configJson: {
          type: Type.STRING,
          description: "New JSON configuration for the component"
        }
      },
      required: ["objectId", "configJson"]
    }
  },
  {
    name: "modify_object",
    description: "Update/move/delete existing object",
    parameters: {
      type: Type.OBJECT,
      properties: {
        objectId: { 
          type: Type.STRING,
          description: "ID of object to modify" 
        },
        action: {
          type: Type.STRING,
          enum: ["MOVE_TO_GRID", "UPDATE_TEXT", "DELETE", "CHANGE_STYLE"]
        },
        value: {
          type: Type.STRING,
          description: "Grid position for MOVE_TO_GRID, new text for UPDATE_TEXT, style name for CHANGE_STYLE"
        }
      },
      required: ["objectId", "action"]
    }
  },
  {
    name: "add_interactive_app",
    description: "Launch a custom web application or interactive simulation on the canvas. AI provides full source code.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Display title of the app" },
        html: { type: Type.STRING, description: "Body HTML content. Tailwind CSS is available." },
        css: { type: Type.STRING, description: "Custom CSS styles" },
        js: { type: Type.STRING, description: "JavaScript for interactivity" },
        gridPosition: {
          type: Type.STRING,
          enum: ["TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"]
        }
      },
      required: ["title", "html", "gridPosition"]
    }
  },
  {
    name: "add_image",
    description: "Place image on canvas",
    parameters: {
      type: Type.OBJECT,
      properties: {
        base64Data: { 
          type: Type.STRING,
          description: "Base64 encoded image data" 
        },
        gridPosition: {
          type: Type.STRING,
          enum: ["TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"]
        }
      },
      required: ["base64Data", "gridPosition"]
    }
  }
];

export const buildSystemInstruction = (
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {}
): string => {
  const pageInfo = pageContext 
    ? `\nCURRENT PAGE: ${pageContext.current + 1} of ${pageContext.total}`
    : "";

  const domEntries = Object.entries(domElements).map(([id, el]) => 
    `- ${el.componentType || 'Interactive'} (ID: ${id})`
  ).join('\n');

  const canvasContext = canvasObjects.length > 0 || Object.keys(domElements).length > 0
    ? `EXISTING OBJECTS:${pageInfo}
${canvasObjects.map((o, i) => `${i+1}. ${o.type} (ID: ${o.id})`).join('\n')}
${domEntries ? `\nINTERACTIVE COMPONENTS:\n${domEntries}` : ''}

You can modify these using modify_object or update_component tools.`
    : `Canvas is empty.${pageInfo} Start by adding objects.`;

  return `You are Smartboard Teach AI, an advanced agentic assistant for educators.
You support inclusion, automation, and interactive learning.

TOOLS AVAILABLE:
- add_mindmap_node: Create labeled boxes/shapes
- connect_nodes: Draw arrows between nodes
- add_text_label: Add standalone text
- add_interactive_app: Build fully functional web apps or complex simulations using HTML/CSS/JS (Tailwind is pre-loaded).
- add_component: Add common widgets like QUIZ, CALCULATOR (real tools), etc.
- update_component: Update an existing widget
- modify_object: Edit existing objects
- pan_camera: Navigate the infinite whiteboard viewport to previous ideas or empty space
- add_image: Place images

ACCESSIBILITY & AUTOMATION FOCUS:
- You help teachers with disabilities by automating layout and design.
- If a teacher asks for a calculator, use add_component with componentType="CALCULATOR".
- If a teacher asks for a complex tool (e.g. "Simulasi Gelombang" or "Daftar Tugas Interaktif"), use add_interactive_app.
- Automated summarizing ("ngerangkum") should use DOCUMENT_PAGE with structured Markdown.

SPECIFIC COMPONENT GUIDELINES:
- add_interactive_app: Use this for fully custom experiences. Write clean, accessible code.
- CALCULATOR: Use this for real math operations.

POSITIONING SYSTEM:
Never calculate X/Y coordinates. Use these positions:
┌─────────┬─────────┬─────────┐
│TOP_LEFT │TOP_CTR  │TOP_RIGHT│
├─────────┼─────────┼─────────┤
│CTR_LEFT │ CENTER  │CTR_RIGHT│
├─────────┼─────────┼─────────┤
│BOT_LEFT │BOT_CTR  │BOT_RIGHT│
└─────────┴─────────┴─────────┘

Or use relative: RIGHT_OF_LAST, BELOW_LAST, etc.

RULES:
1. First object → always use CENTER or relativePosition="CENTER"
2. Multiple similar objects → use relativePosition="RIGHT_OF_LAST" or "BELOW_LAST"
3. Call ALL needed tools in ONE response (batch calling)
4. Keep text responses under 15 words
5. Use update_component when the user wants "next question" or "continue" in the same quiz window.
6. Always check EXISTING OBJECTS to find IDs for update_component or modify_object.
7. When asked to summarize ("ngerangkum"), ALWAYS use DOCUMENT_PAGE component with structured Markdown.

EXAMPLES:

User: "Buat soal selanjutnya di kuis yang sama"
(Assuming QUIZ_MULTIPLE_CHOICE with ID web_123 exists in EXISTING OBJECTS)
You call:
1. update_component(
     objectId="web_123",
     configJson="{\\"question\\":\\"Siapa penemu lampu pijar?\\",\\"options\\":[\\"Einstein\\",\\"Edison\\",\\"Tesla\\"],\\"correctIndex\\":1}"
   )
Text: "Soal berikutnya ditambahkan ke kuis"

User: "Tolong geser kamera ke soal kuis"
(Assuming QUIZ_MULTIPLE_CHOICE with ID web_123 exists in EXISTING OBJECTS)
You call:
1. pan_camera(targetObjectId="web_123")
Text: "Menggeser ke kuis"

User: "Geser ke bawah sedikit dong biar kelihatan kosongnya"
You call:
1. pan_camera(direction="DOWN")
Text: "Melihat ke bawah"

User: "Create mindmap: AI → ML, DL, NLP"
You call:
1. add_mindmap_node(text="AI", relativePosition="CENTER", style="MAIN_TOPIC")
2. add_mindmap_node(text="ML", relativePosition="RIGHT_OF_LAST", style="SUBTOPIC")
3. add_mindmap_node(text="DL", relativePosition="BELOW_LAST", style="SUBTOPIC")
4. add_mindmap_node(text="NLP", relativePosition="BELOW_LAST", style="SUBTOPIC")
5. connect_nodes(fromNodeText="AI", toNodeText="ML", lineStyle="ARROW_STRAIGHT")
6. connect_nodes(fromNodeText="AI", toNodeText="DL", lineStyle="ARROW_STRAIGHT")
7. connect_nodes(fromNodeText="AI", toNodeText="NLP", lineStyle="ARROW_STRAIGHT")
Text: "Created AI mindmap with 3 branches"

User: "Add a math quiz"
You call:
1. add_component(
     componentType="QUIZ_MULTIPLE_CHOICE",
     gridPosition="CENTER",
     configJson="{\\"question\\":\\"What is 7×8?\\",\\"options\\":[\\"54\\",\\"56\\",\\"58\\"],\\"correctIndex\\":1}"
   )
Text: "Added multiplication quiz"

User: "Buat rangkuman materi fisika"
You call:
1. add_component(
     componentType="DOCUMENT_PAGE",
     gridPosition="CENTER",
     configJson="{\\"title\\":\\"Rangkuman Fisika\\",\\"markdown\\":\\"# Hukum Newton\\\\n\\\\n1. **Hukum I**: $\\\\\\\\sum F = 0$\\\\n2. **Hukum II**: $\\\\\\\\sum F = ma$\\\\n3. **Hukum III**: $F_{aksi} = -F_{reaksi}$\\"}"
   )
Text: "Membuat dokumen rangkuman fisika"

${canvasContext}`;
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fixedCalls: any[];
}

export const validateFunctionCalls = (
  calls: any[],
  canvasObjects: CanvasObjectData[]
): ValidationResult => {
  const errors: string[] = [];
  const fixedCalls: any[] = [];

  calls.forEach((call, index) => {
    // Validate object IDs for modify/connect operations
    if (call.name === "modify_object") {
      const requiredId = call.args.objectId;
      
      const ids = Array.isArray(requiredId) ? requiredId : [requiredId];
      ids.forEach(id => {
        if (!canvasObjects.some(o => o.id === id)) {
          errors.push(`Call ${index}: Invalid object ID "${id}"`);
          return; // Skip this call
        }
      });
    }

    // Validate required parameters
    const toolDef = tools.find(t => t.name === call.name);
    if (toolDef) {
      const missing = toolDef.parameters?.required?.filter(
        req => !(req in call.args)
      );
      if (missing && missing.length > 0) {
        errors.push(`Call ${index}: Missing parameters: ${missing.join(', ')}`);
        return;
      }
    }

    fixedCalls.push(call);
  });

  return {
    isValid: errors.length === 0,
    errors,
    fixedCalls
  };
};

export const extractThinking = (response: any): string => {
  if (response.thought) return response.thought;
  
  try {
    const parts = response.candidates?.[0]?.content?.parts || [];
    const thoughtPart = parts.find((p: any) => p.thought === true || p.type === "thinking");
    if (thoughtPart?.text) return thoughtPart.text;
  } catch (e) {
    logger.warn("Failed to extract structured thinking", e);
  }
  
  const text = response.text || "";
  const patterns = [
    /<thought>(.*?)<\/thought>/s,
    /```thinking\n(.*?)\n```/s,
    /\[THINKING\](.*?)\[\/THINKING\]/s
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  return "";
};
