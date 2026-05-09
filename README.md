# Smartboard Teach AI

A voice-controlled interactive whiteboard for educators, powered by local or cloud AI. Built for teachers who need accessibility and don't want to fight with complicated interfaces.

## What It Does

You talk. The AI listens. Your whiteboard fills itself with organized diagrams, flashcards, quiz questions, timers, calculators—whatever you need. Perfect for lesson planning that doesn't require a mouse and keyboard constantly.

### Core Features

- **Voice-first interface**: Speak commands naturally; the AI executes them on a canvas
- **Infinite whiteboard**: Zoom, pan, infinite pages using Fabric.js
- **Dual AI backend**: Use Google Gemini (cloud) or local Ollama (offline) seamlessly
- **Real-time collaboration**: Students see the board live via Socket.IO
- **Teaching tools built-in**: Mind maps, quizzes, flashcards, timers, calculators, periodic table, unit converters, attendance tracking
- **Offline capable**: Run locally with Ollama for zero internet dependency
- **Accessibility-focused**: Designed for teachers with motor disabilities; fully voice-controllable

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Ollama running locally for offline mode: https://ollama.ai
- (Required for cloud mode) Google Gemini API key: https://aistudio.google.com/apikey

### Installation

```bash
git clone <repo>
cd smartboard-teach-ai
npm install
cp .env.example .env.local
```

### Configuration

Edit `.env.local`:

```
# For cloud mode (Google Gemini)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# For offline mode (Ollama)
OLLAMA_URL=http://localhost:11434
```

### Running Locally

**Development mode** (with hot reload):
```bash
npm run dev
```
The frontend starts at `http://localhost:5173` and the backend at `http://localhost:3000`.

**Production mode**:
```bash
npm run build
npm run preview
```

### First Run

1. Open `http://localhost:5173` in your browser
2. Grant microphone permission
3. Try saying: *"Create a mind map about photosynthesis with chlorophyll as the main topic"*

The AI should draw a mind map node and label it. Once that works, you've got the basics running.

## Project Structure

```
smartboard-teach-ai/
├── components/           # React UI components
│   ├── CanvasManager.tsx # Main canvas state & Fabric.js integration
│   ├── ChatInterface.tsx # Voice input & chat display
│   ├── AgentCursor.tsx   # Visual agent cursor animation
│   ├── [Tools]Tool.tsx   # Individual teaching tools
│   └── quiz/             # Quiz-specific components
├── hooks/                # Custom React hooks
│   ├── useGeminiBrain.ts # AI processing logic
│   ├── useAgentProcessor.ts # Agent action execution
│   └── useSocketSync.ts  # Real-time collaboration
├── server/               # Backend Express + Socket.IO
│   ├── aiRouter.ts       # API routes for AI requests
│   ├── geminiAdapter.ts  # Gemini API client
│   ├── ollamaAdapter.ts  # Ollama local API client
│   └── aiTools.ts        # AI function definitions
├── services/
│   ├── aiService.ts      # AI orchestration (Gemini/Ollama switching)
│   └── db.ts             # IndexedDB persistence
├── constants.ts          # Centralized config (models, timeouts, etc.)
├── types.ts              # TypeScript interfaces
├── store.ts              # Zustand global state
└── server.ts             # Express server initialization

```

## How It Works

### Voice Input → AI Processing → Canvas Execution

1. **User speaks**: Web Speech API captures audio
2. **Server receives**: Text sent to either Gemini API or local Ollama
3. **AI responds with function calls**: The AI decides what actions to take (draw shape, create text, move object)
4. **Agent executor**: Canvas updates happen via function execution
5. **Broadcast**: Updates sync to all connected viewers via Socket.IO

### Example: "Create a timeline of the Industrial Revolution"

The AI receives this command and might:
- Call `add_text_label` to write "Industrial Revolution" as title
- Call `add_mindmap_node` multiple times for each era: "1760-1840", "Steam Power", "Factory System", etc.
- Call `connect_nodes` to draw arrows showing progression
- The agent cursor animates across the canvas showing each action

## Configuration Reference

All hardcoded values live in `constants.ts`. Key settings:

```typescript
// AI Model Selection
GEMINI_MODEL = 'gemini-2.0-flash'      // Cloud model
OLLAMA_MODEL = 'gemma:2b'              // Local model (2B params, ~1.5GB)

// Timeout settings
CONFIG.ai.gemini.probeTimeoutMs = 3000 // Cloud API timeout
CONFIG.ai.ollama.probeTimeoutMs = 1500 // Local API timeout

// Server
CONFIG.server.defaultPort = 3000

// UI
CONFIG.ui.mobileBreakpointPx = 1024    // Mobile layout trigger
CONFIG.ui.aiStatusPollIntervalMs = 5000 // How often to check AI availability
```

To use a different Ollama model, edit `constants.ts`:
```typescript
OLLAMA_MODEL = 'mistral' // or 'neural-chat', 'orca-mini', etc.
```

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for containerization and cloud deployment.

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_GEMINI_API_KEY` | If using cloud mode | Google Gemini API key |
| `OLLAMA_URL` | Optional | Local Ollama endpoint (defaults to `http://localhost:11434`) |
| `SERVER_PORT` | Optional | Backend port (defaults to 3000) |

## Troubleshooting

### "API Key Undefined" Error

- Ensure `.env.local` exists in the project root
- File must have: `VITE_GEMINI_API_KEY=your_key_here`
- Restart dev server after changing `.env.local`
- Check browser DevTools → Application → check `VITE_GEMINI_API_KEY` in window object

### Voice Input Not Working

- Chrome/Edge: Fully supported
- Firefox: Fallback to text input (Web Speech API limited support)
- Safari: May require user gesture (click microphone button first)
- Check browser console for errors; grant microphone permission

### "Connection Refused" to Ollama

- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- If not installed: Download from https://ollama.ai
- Check `OLLAMA_URL` in `.env.local` matches your Ollama instance
- On non-localhost Ollama: Verify CORS headers are set (may need Ollama environment config)

### AI Generating Slowly

- **Gemini (Cloud)**: Check API quota at https://aistudio.google.com/app/apikeys
- **Ollama (Local)**: System RAM/VRAM may be bottleneck
  - Monitor with `nvidia-smi` (GPU) or `top` (CPU/RAM)
  - Try smaller model: `OLLAMA_MODEL = 'orca-mini'` in `constants.ts`
  - Ensure no other heavy apps running

### Canvas State Not Persisting

- Browser data cleared? State is auto-saved to IndexedDB at `smartboard-teach-ai` database
- Check DevTools → Application → IndexedDB to verify
- Manual export: Use SaveMenu component to export as JSON
- Server-side state persists to `rooms_persistence.json`

## Development

### Type Checking

```bash
npm run lint  # Run TypeScript compiler without emitting
```

Fix all errors before committing; the CI/CD pipeline requires `tsc --noEmit` to pass.

### Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Test production build locally |
| `npm run lint` | TypeScript type check |
| `npm start` | Run server only (for production) |

### Key Files to Understand

- **services/aiService.ts**: How Gemini/Ollama are selected and called
- **hooks/useGeminiBrain.ts**: AI function calling and response handling
- **components/CanvasManager.tsx**: Canvas state machine and Fabric.js integration
- **server/aiRouter.ts**: Backend AI request handling and retry logic
- **constants.ts**: All configuration and model names

### Testing Locally Without Gemini

1. Start Ollama: `ollama serve`
2. Download model: `ollama pull gemma:2b` (or `ollama pull orca-mini`)
3. Comment out/remove `VITE_GEMINI_API_KEY` from `.env.local`
4. Start dev server: `npm run dev`
5. The app will auto-detect no Gemini key and use Ollama

## Browser Support

| Browser | Voice | Canvas | Notes |
|---------|-------|--------|-------|
| Chrome 90+ | ✓ | ✓ | Full support |
| Edge 90+ | ✓ | ✓ | Full support |
| Firefox 88+ | Partial | ✓ | Text input fallback for voice |
| Safari 14+ | Partial | ✓ | Requires user gesture first |

Mobile: Tested on iPad and Android tablets; responsive layout at <1024px breakpoint.

## Performance Notes

- **Canvas rendering**: Optimized for ~500 shapes before noticeable lag
- **Agent execution**: Average 2-3 second delay between command and execution (includes AI latency)
- **Memory**: IndexedDB storage limit ~50MB per origin (browser-dependent)
- **Network**: Recommend minimum 2 Mbps for cloud Gemini mode; local Ollama has no network requirement

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development guidelines, code style, and PR process.

## License

MIT

---

**For educators:** See [TEACHER_GUIDE.md](./docs/TEACHER_GUIDE.md) for lesson plans, teaching workflows, and tips.

**For developers:** See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for Socket.IO events and AI tool schemas, or [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment instructions
  ├─ API Routes (Gemini proxy, Ollama proxy)
  ├─ Socket Room Management
  ├─ Session Sync
  └─ File Upload Handler
        ↓ API ↓
AI Providers
  ├─ Google Gemini Cloud
  └─ Ollama Local (Optional)
        ↓ Data ↓
Persistence
  ├─ IndexedDB (Browser sessions)
  └─ In-Memory (Server rooms)
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key (get it from https://aistudio.google.com)
- Optional: Ollama (for offline mode)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd smartboard-teach-ai
```

2. Install dependencies
```bash
npm install
```

3. Set up environment
```bash
# Copy example and fill in your API key
cp .env.example .env.local
# Edit .env.local and add:
VITE_GEMINI_API_KEY=your_api_key_here
```

4. Start development server
```bash
npm run dev
```

5. Open browser
```
http://localhost:5173
```

## Configuration

### Environment Variables (.env.local)

```env
# Required: Google Gemini API key
VITE_GEMINI_API_KEY=sk-...

# Optional: Ollama server for offline mode
OLLAMA_URL=http://localhost:11434

# Optional: Server port
SERVER_PORT=3000

# Optional: Model names (usually auto-detected)
GEMINI_MODEL=gemini-2-flash
OLLAMA_MODEL=gemma4:e2b
```

### Optional: Ollama Setup for Offline Mode

If you want to use local AI without cloud dependency:

1. Install Ollama from https://ollama.ai
2. Download model: `ollama pull gemma4:e2b`
3. Start Ollama: `ollama serve`
4. Set `OLLAMA_URL` in .env.local

The app will auto-detect network and switch between Gemini (cloud) and Ollama (local).

## Usage

### Basic Workflow

1. **Connect**: Open app in browser or share URL with viewers
2. **Speak**: Use voice to give commands like:
   - "Create a mind map about photosynthesis"
   - "Generate a 5-question quiz"
   - "Start a 10-minute timer"
3. **Watch**: AI agent animates actions on the board
4. **View**: Viewers see real-time synchronized canvas

### Voice Commands Examples

```
Teaching
  "Summarize what's on the board"
  "Create a timeline from 1990 to 2024"
  "Draw a flowchart for the water cycle"

Organization
  "Make this text bigger"
  "Change the color to blue"
  "Center everything"

Interactive
  "Create a matching quiz"
  "Start a 15-minute timer"
  "Open the periodic table"
```

### Keyboard Shortcuts

- `V` - Start/stop voice input
- `S` - Save session
- `L` - Load previous session
- `E` - Export as image
- `Ctrl+Z` - Undo (canvas only)
- `Ctrl+Y` - Redo (canvas only)

## Development

### Project Structure

```
src/
  ├─ components/        # React UI components
  │  ├─ CanvasManager.tsx
  │  ├─ ChatInterface.tsx
  │  ├─ <ToolName>Tool.tsx
  │  └─ quiz/           # Quiz component variants
  ├─ hooks/             # React custom hooks
  │  ├─ useGeminiBrain.ts
  │  ├─ useAgentProcessor.ts
  │  └─ useSocketSync.ts
  ├─ services/          # Business logic
  │  ├─ aiService.ts
  │  ├─ geminiAdapter.ts
  │  └─ ollamaAdapter.ts
  ├─ server/            # Backend routes
  │  ├─ aiRouter.ts
  │  ├─ aiTools.ts
  │  └─ ...
  ├─ store.ts           # Zustand global state
  ├─ constants.ts       # Config & constants
  ├─ types.ts           # TypeScript definitions
  └─ App.tsx            # Root component
```

### Key Technologies

- **Frontend**: React 19, Vite, TypeScript
- **Canvas**: Fabric.js
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Real-time**: Socket.IO
- **Backend**: Express 5, Node.js
- **AI**: Google Gemini API, Ollama
- **Build**: Vite
- **Voice**: Web Speech API

### Available Scripts

```bash
# Development
npm run dev           # Start dev server with hot reload
npm run lint          # TypeScript type checking
npm run build         # Build for production
npm run preview       # Preview production build locally

# Server only
npm start             # Start Express server

# Docker
docker build -t smartboard .
docker run -p 3000:3000 smartboard
```

### Testing & Debugging

```bash
# Type checking
npm run lint

# Debug mode (verbose logging)
DEBUG=smartboard:* npm run dev

# Test AI locally without frontend
node scripts/testAgent.ts

# Browser DevTools
F12 - Open developer console
- Check Network tab for API calls
- Check Console for errors
- Use React DevTools for component debugging
```

## Deployment

### Cloud Deployment (Recommended)

#### Using Azure App Service

1. Create App Service resource
2. Set environment variables in portal
3. Deploy using GitHub Actions or manual push

```bash
# Using Azure CLI
az webapp up --name smartboard-teach --resource-group mygroup
```

#### Using Docker

```bash
# Build image
docker build -t smartboard:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e VITE_GEMINI_API_KEY=$API_KEY \
  smartboard:latest
```

### Local Production Testing

```bash
# Build and test locally
npm run build
npm run preview

# Then visit: http://localhost:4173
```

## Accessibility Features

### For Teachers with Disabilities

**Motor/Physical Disabilities**
- Complete voice control (no mouse/keyboard needed)
- Large touch targets for those with motor imprecision
- Customizable font sizes and spacing

**Visual Disabilities**
- High contrast mode support
- Large text options
- Voice feedback for actions

**Cognitive Accessibility**
- Simple, consistent interface
- Clear visual hierarchy
- Auto-organization features (mind maps, summaries)
- Calm, distraction-free mode

**Hearing Impairments**
- All audio has visual alternatives
- Visual indicators for voice recognition
- Keyboard-only navigation

## Troubleshooting

### "API Key Not Working"

**Problem**: "Synchronization failed" error when using voice

**Solution**:
1. Check `.env.local` has `VITE_GEMINI_API_KEY` set
2. Ensure API key is valid at https://aistudio.google.com
3. Verify you're using `VITE_` prefix (required by Vite)
4. Run `npm run build` to test production build

### "Voice Not Working"

**Problem**: Voice button doesn't respond or no permission prompt

**Solution**:
1. Check browser compatibility (Chrome/Edge recommended, Firefox limited)
2. Allow microphone permission when prompted
3. Try refreshing the page
4. Check browser console for errors

### "Canvas Not Syncing"

**Problem**: Viewers see outdated board state

**Solution**:
1. Check server is running: `npm run dev` shows "Server running on 3000"
2. Check WebSocket connection in browser DevTools > Network > WS
3. Restart server: `Ctrl+C` and `npm run dev` again
4. Clear browser cache

### "Offline Mode Not Working"

**Problem**: Can't use app without internet

**Solution**:
1. Ensure Ollama is running: `ollama serve`
2. Model must be downloaded: `ollama pull gemma4:e2b`
3. Set `OLLAMA_URL` in .env.local
4. Restart dev server
5. Check browser console for connection attempts

## Performance Optimization

### For Smooth Teaching

- **Large Boards**: Limit to 100 objects per page for smooth performance
- **Voice Processing**: 3-5 second response time is normal for Gemini
- **Offline**: Ollama is faster locally (1-2 seconds) but lower quality
- **Viewers**: Sync latency ~500ms (normal for WebSocket)

### Optimization Tips

- Use "Auto Clear" to remove old content
- Split complex lessons across pages
- Use Ollama locally for faster feedback
- Close unused viewer connections
- Clear browser storage if laggy

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | Full | Recommended, voice works great |
| Edge | Full | Voice works, identical to Chrome |
| Firefox | Partial | Voice not supported, canvas works |
| Safari | Partial | Limited voice support, canvas works |
| Mobile browsers | Limited | Small screen, touch interaction works |

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and commit: `git commit -m "Add my feature"`
4. Push and create Pull Request

## Issues & Feedback

Found a bug? Have a suggestion?

1. Check existing issues: https://github.com/yourrepo/issues
2. Create new issue with:
   - Screenshot or video
   - Browser and OS version
   - Steps to reproduce
   - Expected vs actual behavior

## License

MIT License - See LICENSE file for details

## Support & Contact

**Questions?** Open an issue or email support@smartboard-teach.ai

**Feature Requests?** Vote on existing ideas or suggest new ones

**For Educators**: Email teaching@smartboard-teach.ai for bulk licensing

## Acknowledgments

Built with love for educators, especially those with accessibility needs. Special thanks to the accessibility community for guidance.

---

**Ready to revolutionize your classroom? Start with voice: "Hello, make a mind map!"**
