# Smartboard Teach AI

A next-generation interactive whiteboard platform powered by AI, designed for educators to create, teach, and engage students through voice-controlled, intelligent canvas automation.

## Overview

Smartboard Teach AI combines agentic artificial intelligence with an infinite digital whiteboard to help teachers (especially those with accessibility needs) deliver engaging, interactive lessons. The platform uses vision, voice, and intelligent action execution to transform verbal instructions into visual learning content.

## Key Features

### Core Capabilities

- **Interactive Infinite Whiteboard**: Fabric.js-powered canvas with zoom, pan, and multiple page support
- **Voice-First Interface**: Natural language commands via Web Speech API
- **Agentic AI Actions**: Visual agent cursor that executes teaching tools automatically
- **Real-Time Collaboration**: Multi-viewer support via Socket.IO for student access
- **Dual-Mode AI**: Cloud-based Gemini API or local Ollama for offline teaching
- **Accessibility-First Design**: Fully voice-controllable for teachers with motor disabilities

### Teaching Tools

- **Mind Map Generator**: Automatically create concept maps with AI-drawn nodes and connections
- **Quiz Generator**: Generate multiple-choice, essay, true/false, and matching questions
- **Calculator**: Interactive calculation tool with visual display
- **Timer**: Classroom timer with visual countdown
- **Flashcard System**: Automated study card creation
- **Periodic Table**: Interactive chemistry reference
- **Unit Converter**: Real-time unit conversion
- **Note Taking**: Sticky notes and structured notes
- **Attendance Tracker**: Student presence management
- **Custom App Builder**: Generate HTML/CSS/JS widgets on-the-fly

### Intelligent Features

- **Canvas Understanding**: AI analyzes current board state through vision
- **Function Calling**: Execute precise actions through agentic tool use
- **Context Awareness**: Agent understands spatial layout and element relationships
- **Animated Execution**: Smooth Bezier-eased agent cursor movements
- **Session Persistence**: Auto-save to IndexedDB browser storage

## System Architecture

```
Frontend (React + Vite)
  ├─ Canvas Layer (Fabric.js)
  ├─ AI Brain (Gemini/Ollama)
  ├─ Voice Input (Web Speech API)
  └─ Components (Teaching Tools)
        ↓ HTTP/WebSocket ↓
Backend Server (Express + Socket.IO)
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
