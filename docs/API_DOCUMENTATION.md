# API Documentation

## Socket.IO Events

The real-time collaboration system uses Socket.IO. Hosts emit canvas updates; viewers receive and display them.

### Client → Server Events

#### `join-room`
Join a classroom board.

```typescript
socket.emit('join-room', roomId: string)
```

**Parameters:**
- `roomId` (string): Unique identifier for the classroom board (e.g., "class-math-101")

**Response:** Server sends back `canvas-init` and `viewport-update` events with current state.

**Example:**
```typescript
socket.emit('join-room', 'class-algebra-period-2');
```

---

#### `canvas-update`
Broadcast canvas state changes to all viewers in a room.

```typescript
socket.emit('canvas-update', {
  roomId: string,
  data: CanvasJson
})
```

**Parameters:**
- `roomId` (string): Room identifier
- `data` (CanvasJson): Serialized Fabric.js canvas state (array of objects)

**Details:**
- Emitted by the host (teacher) whenever the canvas changes
- Server stores this state and sends to newly joining viewers
- State persists to `rooms_persistence.json` for recovery on server restart

**Example:**
```typescript
const canvasState = canvas.toJSON();
socket.emit('canvas-update', {
  roomId: 'class-math-101',
  data: canvasState
});
```

---

#### `viewport-update`
Sync camera position (zoom + pan) to viewers.

```typescript
socket.emit('viewport-update', {
  roomId: string,
  viewport: ViewportTransform // [scaleX, scaleY, translateX, translateY, ...]
})
```

**Details:**
- Allows viewers to see exactly where the teacher is looking on the board
- ViewportTransform is a numeric array from Fabric.js viewport

**Example:**
```typescript
socket.emit('viewport-update', {
  roomId: 'class-math-101',
  viewport: [1.2, 1.2, -150, 200] // 120% zoom, offset
});
```

---

#### `dom-elements-update`
Send custom HTML/CSS widget state (built-in tools rendered as HTML overlays).

```typescript
socket.emit('dom-elements-update', {
  roomId: string,
  elements: Record<string, DomElementState>
})
```

**DomElementState:**
```typescript
{
  id: string;              // Unique element ID
  html: string;            // Raw HTML content
  componentType?: string;  // 'CALCULATOR', 'TIMER', 'QUIZ', etc.
  config?: any;            // Component-specific config
  x: number;               // Canvas X position
  y: number;               // Canvas Y position
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  zIndex: number;
}
```

**Example:**
```typescript
socket.emit('dom-elements-update', {
  roomId: 'class-math-101',
  elements: {
    'calculator-1': {
      id: 'calculator-1',
      componentType: 'CALCULATOR',
      html: '<div>...</div>',
      x: 100,
      y: 200,
      width: 300,
      height: 400,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      zIndex: 10
    }
  }
});
```

---

#### `agent-action-execute`
Tell the server to execute a specific agent action (draw shape, create text, etc.).

```typescript
socket.emit('agent-action-execute', {
  roomId: string,
  action: AgentAction
})
```

**AgentAction:**
```typescript
{
  id: string;
  type: 'MOVE_CURSOR' | 'CREATE_SHAPE' | 'DRAW_PATH' | 'WRITE_TEXT' | 
        'CREATE_SVG' | 'RENDER_HTML' | 'DELETE_OBJECT' | etc.;
  payload: any;  // Action-specific data
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}
```

---

### Server → Client Events

#### `canvas-init`
Sent when client joins a room; initializes the canvas state.

```typescript
socket.on('canvas-init', (canvasState: CanvasJson) => {
  // canvasState is full Fabric.js canvas JSON
  canvas.loadFromJSON(canvasState, () => {
    canvas.renderAll();
  });
});
```

---

#### `canvas-update`
Receives updated canvas state from the host.

```typescript
socket.on('canvas-update', (canvasState: CanvasJson) => {
  canvas.loadFromJSON(canvasState, () => {
    canvas.renderAll();
  });
});
```

---

#### `viewport-update`
Receives camera position from the host.

```typescript
socket.on('viewport-update', ({ socketId, viewport }: { socketId: string; viewport: ViewportTransform }) => {
  // Apply viewport to canvas
  canvas.setViewportTransform(viewport);
});
```

---

#### `dom-elements-init`
Sent on join; initializes HTML overlay elements.

```typescript
socket.on('dom-elements-init', (elements: Record<string, DomElementState>) => {
  // Render components based on elements
  Object.values(elements).forEach(el => {
    renderDomElement(el);
  });
});
```

---

#### `dom-elements-update`
Receives updated HTML overlay state.

```typescript
socket.on('dom-elements-update', (elements: Record<string, DomElementState>) => {
  // Update DOM elements
});
```

---

#### `agent-state-update`
Real-time agent status (cursor position, thinking, executing, etc.).

```typescript
socket.on('agent-state-update', (agentState: AgentState) => {
  // Update agent cursor visuals, logs, etc.
  setCursorPosition(agentState.cursorPosition);
});
```

**AgentState:**
```typescript
{
  cursorPosition: { x: number; y: number };
  spatialTarget: { x: number; y: number } | null;
  accuracy: number;           // 0-100
  isThinking: boolean;
  isActing: boolean;
  isClicking: boolean;
  currentAction: string | null;
  logs: string[];
  agentMessage: string | null; // "I'm creating a mind map..."
}
```

---

## HTTP API Routes

### `/api/generate` (POST)

Generate AI content (mind maps, quizzes, analysis).

**Request:**
```json
{
  "prompt": "Create a mind map about water cycle",
  "context": {
    "canvasState": [...],
    "boardTitle": "Science Lesson 1"
  },
  "preference": "auto"  // "gemini", "ollama", or "auto"
}
```

**Response:**
```json
{
  "thinking": "I need to break down the water cycle...",
  "actions": [
    {
      "id": "action-1",
      "type": "CREATE_SHAPE",
      "payload": {
        "shapeType": "CIRCLE",
        "text": "Water",
        "left": 400,
        "top": 300
      }
    }
  ],
  "message": "Created water cycle mind map with evaporation, condensation, and precipitation",
  "executionTime": 2341
}
```

---

### `/api/transcribe` (POST)

Convert audio to text (voice input).

**Request:**
```json
{
  "audio": "base64-encoded-audio",
  "language": "en-US"
}
```

**Response:**
```json
{
  "text": "Create a timeline of the Renaissance",
  "confidence": 0.95
}
```

---

### `/api/ai-status` (GET)

Check which AI providers are available.

**Response:**
```json
{
  "gemini": {
    "available": true,
    "latency": 145
  },
  "ollama": {
    "available": true,
    "latency": 89,
    "model": "gemma:2b"
  },
  "selectedMode": "auto"  // "gemini", "ollama", or "auto"
}
```

---

## AI Tool Definitions

These are the function calls available to the AI model. The AI decides which to use based on the user's command.

### `add_mindmap_node`

Add a labeled shape (node) to the canvas.

```typescript
{
  name: "add_mindmap_node",
  parameters: {
    text: string,                        // Label text
    relativePosition: "CENTER" | "RIGHT_OF_LAST" | "BELOW_LAST" | "LEFT_OF_LAST" | "ABOVE_LAST",
    style?: "MAIN_TOPIC" | "SUBTOPIC" | "DETAIL" | "HIGHLIGHT"
  }
}
```

**Backend Handling:**
- Main topic: Large circle, bold text, center of canvas
- Subtopic: Medium circle, regular text, positioned relative to last node
- Detail: Small circle, smaller text
- Highlight: Colored fill based on context

---

### `connect_nodes`

Draw a line/arrow between two existing nodes.

```typescript
{
  name: "connect_nodes",
  parameters: {
    fromNodeText: string,     // Source node label
    toNodeText: string,       // Target node label
    lineStyle?: "ARROW_STRAIGHT" | "ARROW_CURVED" | "LINE"
  }
}
```

---

### `add_text_label`

Add standalone text (not inside a shape).

```typescript
{
  name: "add_text_label",
  parameters: {
    text: string,
    gridPosition?: "TOP_LEFT" | "TOP_CENTER" | ... | "BOTTOM_RIGHT",
    size?: "TITLE" | "SUBTITLE" | "BODY" | "CAPTION"
  }
}
```

---

### `add_table`

Create a data table with rows and columns.

```typescript
{
  name: "add_table",
  parameters: {
    headers: string[],      // Column headers
    rows: string[][],       // Data rows
    title?: string
  }
}
```

---

### `create_shape`

Draw a basic shape (rectangle, circle, triangle, etc.).

```typescript
{
  name: "create_shape",
  parameters: {
    shapeType: "RECTANGLE" | "CIRCLE" | "TRIANGLE" | "STAR",
    left: number,           // X position
    top: number,            // Y position
    width: number,
    height: number,
    fillColor?: string,     // Hex color (default: light blue)
    label?: string          // Optional text inside
  }
}
```

---

### `draw_path`

Freehand drawing (continuous line).

```typescript
{
  name: "draw_path",
  parameters: {
    points: Array<{x: number; y: number}>,  // Line points
    strokeColor?: string,
    strokeWidth?: number
  }
}
```

---

### `write_text`

Add multi-line text at specific position.

```typescript
{
  name: "write_text",
  parameters: {
    text: string,
    left: number,
    top: number,
    fontSize?: number,
    fontFamily?: string,
    fill?: string
  }
}
```

---

### `render_html`

Render custom HTML/CSS widget on canvas.

```typescript
{
  name: "render_html",
  parameters: {
    html: string,           // Raw HTML
    css?: string,           // Scoped CSS
    componentType?: string, // "CALCULATOR", "TIMER", "QUIZ", etc.
    config?: object         // Component config
  }
}
```

---

### `delete_object`

Remove an object from canvas by ID or label.

```typescript
{
  name: "delete_object",
  parameters: {
    target: string  // Object ID or label text
  }
}
```

---

### `clear_canvas`

Remove all objects from canvas.

```typescript
{
  name: "clear_canvas",
  parameters: {}
}
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Invalid/missing API key | Check VITE_GEMINI_API_KEY env var |
| 429 | Rate limited (Gemini quota exceeded) | Wait or upgrade API plan |
| 503 | AI unavailable (Ollama not running) | Start Ollama or switch to Gemini |
| 504 | Timeout (response took >30s) | Simplify prompt or check network |
| 422 | Invalid action payload | Check tool schema |

---

## Rate Limiting

- **Gemini**: Depends on your API quota (free tier: ~60 requests/min)
- **Ollama**: No rate limit (local processing)
- **Socket.IO sync**: Debounced 300ms to prevent overload

---

## Example: Creating a Quiz

**User:** *"Create a multiple choice quiz about the solar system"*

**AI Response (Sequence of function calls):**

1. `add_text_label` → "Solar System Quiz"
2. `add_text_label` → "1. Which planet is closest to the sun?"
3. `create_shape` (RECTANGLE) → "A) Mercury"
4. `create_shape` (RECTANGLE) → "B) Venus"
5. `create_shape` (RECTANGLE) → "C) Earth"
6. `create_shape` (RECTANGLE) → "D) Mars"
7. Repeat for questions 2-5

**What You See:** Agent cursor animates across the canvas, creating the quiz layout in ~3-5 seconds.

---

## Testing Socket Events

Use browser console to test:

```javascript
// Connect
const socket = io('http://localhost:3000');

// Join room
socket.emit('join-room', 'test-room');

// Listen for state
socket.on('canvas-init', (state) => console.log('Canvas loaded:', state));

// Send update
socket.emit('canvas-update', {
  roomId: 'test-room',
  data: canvas.toJSON()
});
```

---

## CORS & Security

Socket.IO is configured to accept connections from `*` (any origin). For production, restrict this:

**In server.ts:**
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: ["https://yourdomain.com"],  // Whitelist your domain
    methods: ["GET", "POST"]
  }
});
```

---

## Performance Tuning

### For Slow AI Responses:

**Check latency:**
```bash
curl -o /dev/null -s -w '%{time_total}\n' http://localhost:11434/api/tags
```

If Ollama is slow, try smaller model:
```typescript
// constants.ts
OLLAMA_MODEL = 'orca-mini';  // Faster, ~7B params
```

### For Canvas Lag:

Keep canvas object count under 500 for smooth rendering. If exceeding:
- Delete old objects: `socket.emit('agent-action-execute', {type: 'DELETE_OBJECT'})`
- Create new page: Implement page management UI
- Simplify shapes: Use SVG instead of multiple Fabric objects

---

