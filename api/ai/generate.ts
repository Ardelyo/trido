export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    body = body || {};

    const {
      prompt,
      canvasImageBase64,
      canvasObjects = [],
      viewport = { width: 1920, height: 1080 },
      highResInputImage,
      history = [],
      pageContext,
      domElements = {},
      selectedVertexModel,
      selectedGeminiModel,
      intent,
      forceTools
    } = body;

    const rawModel = selectedVertexModel || selectedGeminiModel || process.env.VERTEX_MODEL || 'gemini-3.8-flash';
    const modelName = (rawModel === 'gemini-3.7-flash' ? 'gemini-3.8-flash' : rawModel).trim();

    const { GoogleAuth } = await import('google-auth-library');
    const adcRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentials = adcRaw ? JSON.parse(adcRaw.trim()) : undefined;

    const auth = new GoogleAuth({
      ...(credentials ? { credentials } : {}),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    const projectId = (process.env.GOOGLE_CLOUD_PROJECT || 'gemma4good-494311').trim();
    const location = (process.env.GOOGLE_CLOUD_LOCATION || 'global').trim();

    const extractImagePayload = (rawUri?: string | null) => {
      if (!rawUri || typeof rawUri !== 'string') return null;
      const trimmed = rawUri.trim();
      if (!trimmed) return null;
      const match = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/s);
      if (match) {
        return { mimeType: match[1], data: match[2].trim() };
      }
      return { mimeType: 'image/png', data: trimmed };
    };

    const canvasPayload = extractImagePayload(canvasImageBase64);
    const inputImagePayload = extractImagePayload(highResInputImage);

    const existingObjectsContext = canvasObjects && canvasObjects.length > 0
      ? canvasObjects.map((o: any) => `  - [ID: ${o.id}] "${o.textContent || o.text || o.label || o.id}" (${o.type}) at X=${o.left}, Y=${o.top}, W=${o.width || 0}, H=${o.height || 0}`).join('\n')
      : '  (Canvas is currently empty)';

    const domContext = domElements && Object.keys(domElements).length > 0
      ? Object.entries(domElements).map(([id, d]: any) => `  - [Widget ID: ${id}] ${d.componentType || 'Widget'} at X=${d.x || 0}, Y=${d.y || 0} title="${d.config?.title || d.title || ''}"`).join('\n')
      : '  (None)';

    const systemInstruction = `You are Trido, an autonomous agentic interactive whiteboard and pedagogical AI.
You have FULL AUTONOMOUS COMPUTER USE capabilities to create, draw, move, and manipulate content on the whiteboard canvas.

CURRENT CANVAS STATE:
- Viewport: width=${viewport.width}, height=${viewport.height}
- Existing Canvas Objects:
${existingObjectsContext}
- Existing Interactive Widgets:
${domContext}

FULL AUTONOMOUS COMPUTER USE CAPABILITIES:
1. PINDAHKAN ELEMEN (Move/Drag):
   - When asked to move or drag an element (e.g. "pindahkan", "geser"), call \`drag_element\` with \`elementText\` matching the element label (or \`objectId\`) and destination \`toX\`, \`toY\`.
2. PINDAHKAN SEMUA (Move/Shift All):
   - When asked to move or shift all elements (e.g. "geser semua ke kanan"), call \`drag_all_elements\` with \`deltaX\` and \`deltaY\`.
3. TARIK GARIS & BUAT PANAH (Draw Lines & Arrows):
   - When asked to draw lines or arrows (e.g. "tarik garis", "buatkan panah ke arah...", "hubungkan"), call \`connect_nodes\`:
     * From one node to another: \`fromNodeText\` and \`toNodeText\`.
     * From a node pointing in a direction: \`fromNodeText\` and \`direction\` ("RIGHT", "LEFT", "UP", "DOWN", "UP_RIGHT", "DOWN_RIGHT", etc.).
     * Between explicit coordinates: \`fromX\`, \`fromY\` to \`toX\`, \`toY\`.
     * Line style: \`lineStyle\` ("ARROW_STRAIGHT", "ARROW_CURVED", "LINE").
4. BUAT BENTUK (Shapes):
   - Call \`create_shape\` with \`shapeType\` ("RECTANGLE", "CIRCLE", "TRIANGLE", "ARROW", "LINE"), \`x\`, \`y\`, \`width\`, \`height\`, and optional \`fill\` and \`label\`.
5. KLIK ELEMEN (Click):
   - Call \`click_element\` with \`elementText\` or coordinates to click buttons, interactive quiz options, or select objects.
6. MIND MAP:
   - Call \`add_mindmap_node\` with \`text\`, \`style\` ("MAIN_TOPIC", "SUBTOPIC", "DETAIL"), and \`parentNodeText\`.
7. WIDGET & KUIS:
   - Call \`add_component\` for quizzes, markdown notes, timer, calculator.
8. APP MINI INTERAKTIF:
   - Call \`add_interactive_app\` with custom HTML/JS simulation.

CRITICAL EXECUTION RULES:
- ALWAYS call the appropriate tool immediately! NEVER say "I will move it" without calling the tool.
- Batch multiple actions together in a single turn when appropriate.
- Respond in natural Indonesian (Bahasa Indonesia).`;

    const toolsDeclarations = [
      {
        name: "add_mindmap_node",
        description: "Add a node to a mind map or concept diagram. Connections are generated automatically from parentNodeText.",
        parameters: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING", description: "Label text shown inside the node" },
            style: { type: "STRING", enum: ["MAIN_TOPIC", "SUBTOPIC", "DETAIL", "HIGHLIGHT"], description: "Visual style" },
            parentNodeText: { type: "STRING", description: "Exact text of the parent node" }
          },
          required: ["text", "style"]
        }
      },
      {
        name: "connect_nodes",
        description: "Draw a line or arrow between elements, coordinates, or in a specific direction.",
        parameters: {
          type: "OBJECT",
          properties: {
            fromNodeText: { type: "STRING", description: "Source element label or text (optional)" },
            toNodeText: { type: "STRING", description: "Destination element label or text (optional)" },
            fromX: { type: "NUMBER", description: "Start X coordinate (optional)" },
            fromY: { type: "NUMBER", description: "Start Y coordinate (optional)" },
            toX: { type: "NUMBER", description: "End X coordinate (optional)" },
            toY: { type: "NUMBER", description: "End Y coordinate (optional)" },
            direction: { type: "STRING", enum: ["RIGHT", "LEFT", "UP", "DOWN", "UP_RIGHT", "UP_LEFT", "DOWN_RIGHT", "DOWN_LEFT"], description: "Direction to point arrow (e.g. RIGHT, DOWN)" },
            lineStyle: { type: "STRING", enum: ["ARROW_STRAIGHT", "ARROW_CURVED", "LINE"], description: "Arrow or line style" },
            strokeColor: { type: "STRING", description: "Hex stroke color code" }
          }
        }
      },
      {
        name: "add_component",
        description: "Add a complex pre-built educational UI component to the board canvas.",
        parameters: {
          type: "OBJECT",
          properties: {
            componentType: {
              type: "STRING",
              enum: ["QUIZ_MULTIPLE_CHOICE", "QUIZ_APP", "QUIZ_TRUE_FALSE", "QUIZ_ESSAY", "DOCUMENT_PAGE", "MARKDOWN_NOTE", "TIMER", "CALCULATOR"],
              description: "Component type. For quizzes use QUIZ_MULTIPLE_CHOICE or QUIZ_APP."
            },
            title: { type: "STRING", description: "Header title displayed on top of the widget" },
            configJson: {
              type: "STRING",
              description: "JSON configuration string. For QUIZ_MULTIPLE_CHOICE: {\"question\":\"Teks soal lengkap\",\"options\":[\"Opsi A\",\"Opsi B\",\"Opsi C\",\"Opsi D\"],\"correctIndex\":0,\"explanation\":\"Penjelasan pembahasan\"}. For QUIZ_TRUE_FALSE: {\"statement\":\"Pernyataan sains/fakta\",\"isTrue\":true,\"explanation\":\"Penjelasan\"}. For DOCUMENT_PAGE/MARKDOWN_NOTE: {\"markdown\":\"# Judul\\n\\nTeks pembahasan materi...\"}."
            },
            x: { type: "NUMBER", description: "X coordinate (e.g. 1100)" },
            y: { type: "NUMBER", description: "Y coordinate (e.g. 100)" }
          },
          required: ["componentType", "title"]
        }
      },
      {
        name: "add_interactive_app",
        description: "Add a fully interactive, self-contained mini web app or simulation widget.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Widget title" },
            html: { type: "STRING", description: "Complete HTML snippet with Tailwind & script" },
            width: { type: "NUMBER", description: "Width" },
            height: { type: "NUMBER", description: "Height" }
          },
          required: ["title", "html"]
        }
      },
      {
        name: "create_shape",
        description: "Draw a geometric shape on the canvas.",
        parameters: {
          type: "OBJECT",
          properties: {
            shapeType: { type: "STRING", enum: ["RECTANGLE", "CIRCLE", "TRIANGLE", "ARROW", "LINE"], description: "Geometry" },
            x: { type: "NUMBER", description: "X coordinate" },
            y: { type: "NUMBER", description: "Y coordinate" },
            width: { type: "NUMBER", description: "Width" },
            height: { type: "NUMBER", description: "Height" },
            color: { type: "STRING", description: "Hex color" },
            label: { type: "STRING", description: "Optional text label" }
          },
          required: ["shapeType", "x", "y"]
        }
      },
      {
        name: "add_text",
        description: "Place freeform text or formula on the canvas.",
        parameters: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING", description: "Text or formula" },
            x: { type: "NUMBER", description: "X coordinate" },
            y: { type: "NUMBER", description: "Y coordinate" },
            fontSize: { type: "NUMBER", description: "Font size" },
            color: { type: "STRING", description: "Color" }
          },
          required: ["text", "x", "y"]
        }
      },
      {
        name: "drag_element",
        description: "Agentic Computer Use: Drag and drop an element or node across the canvas to a new (toX, toY) coordinate. Target by elementText (label/title) OR by objectId.",
        parameters: {
          type: "OBJECT",
          properties: {
            elementText: { type: "STRING", description: "Text or label of the node/element to drag" },
            objectId: { type: "STRING", description: "Optional object ID" },
            toX: { type: "NUMBER", description: "Target X position" },
            toY: { type: "NUMBER", description: "Target Y position" }
          },
          required: ["toX", "toY"]
        }
      },
      {
        name: "drag_all_elements",
        description: "Agentic Computer Use: Reposition and shift ALL elements on the canvas together by deltaX and deltaY offset pixels.",
        parameters: {
          type: "OBJECT",
          properties: {
            deltaX: { type: "NUMBER", description: "Horizontal shift distance in pixels" },
            deltaY: { type: "NUMBER", description: "Vertical shift distance in pixels" }
          },
          required: ["deltaX", "deltaY"]
        }
      },
      {
        name: "click_element",
        description: "Agentic Computer Use: Move agent cursor and click an element, button, option, or coordinate.",
        parameters: {
          type: "OBJECT",
          properties: {
            elementText: { type: "STRING", description: "Text or label of the button or element to click" },
            objectId: { type: "STRING", description: "Optional object ID" },
            x: { type: "NUMBER", description: "Target X coordinate" },
            y: { type: "NUMBER", description: "Target Y coordinate" }
          }
        }
      }
    ];

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
      })),
      {
        role: "user",
        parts: [
          ...(canvasPayload?.data ? [{ inlineData: { mimeType: canvasPayload.mimeType, data: canvasPayload.data } }] : []),
          ...(inputImagePayload?.data ? [{ inlineData: { mimeType: inputImagePayload.mimeType, data: inputImagePayload.data } }] : []),
          { text: `User request: ${prompt}\n\nRemember: Use function calls, not descriptions. Batch all actions together.` }
        ]
      }
    ];

    const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:generateContent`;

    const vertexRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          thinkingConfig: {
            thinkingBudget: 0
          }
        },
        tools: [{ functionDeclarations: toolsDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO'
          }
        }
      })
    });

    const data = await vertexRes.json();
    if (!vertexRes.ok) {
      throw new Error(data.error?.message || vertexRes.statusText);
    }

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    let functionCalls: any[] = [];
    let textResponse = "";

    for (const part of parts) {
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {}
        });
      }
      if (part.text) {
        textResponse += part.text;
      }
    }

    return res.status(200).json({
      functionCalls,
      textResponse,
      thought: "",
      validationErrors: []
    });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Layanan AI mengalami kendala.',
      stack: err.stack,
      code: status === 401 ? 'invalid_key' : status === 429 ? 'rate_limited' : 'server_error',
      retryable: status >= 500 || status === 429
    });
  }
}
