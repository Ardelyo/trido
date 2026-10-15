# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |

## Security Architecture & Built-In Safeguards

Trido is designed for classroom and school environments with strict client-side and server-side security boundaries:

1. **SSRF Protection on Local AI Endpoints (`server/aiRouter.ts`, `server/ollamaAdapter.ts`, `api/ai/*.ts`)**
   - All user-supplied Ollama URLs (`ollamaBaseUrl`) are parsed via `new URL()` and restricted strictly to `http:`/`https:` on loopback hosts (`localhost`, `127.0.0.1`, `[::1]`) or the server's pre-configured `OLLAMA_BASE_URL` host.
   - Model pull requests (`/api/ai/pull-model`) validate model names against a strict allowlist regex (`/^[a-zA-Z0-9._:/-]+$/`) and Faster-Whisper (`server/whisperService.py`) enforces a strict model size allowlist.

2. **Sandboxed Interactive Apps (`components/AppBuilderTool.tsx`)**
   - AI-generated HTML/CSS/JS mini-apps run inside `<iframe srcDoc sandbox="allow-scripts allow-forms">` **without** `allow-same-origin`.
   - Embedded scripts cannot read `window.parent.localStorage`, cannot access API keys, and cannot strip their own `sandbox` attribute.
   - Closing `</script>` and `</style>` sequences are escaped before `srcDoc` interpolation, and runtime error handlers use `textContent` instead of `innerHTML`.

3. **XSS Sanitization Across DOM Overlays & Document Exports (`components/DomOverlay.tsx`, `components/MermaidTool.tsx`, `utils/smartExport.ts`)**
   - Raw widget HTML rendered via `dangerouslySetInnerHTML` is sanitized with `DOMPurify.sanitize()`.
   - Mermaid diagrams initialize with `securityLevel: 'antiscript'` and pass through the deterministic AST sanitizer (`utils/mermaidSanitizer.ts`).
   - Printable worksheets, HTML document exports, and interactive app exports escape all interpolated titles, questions, options, and markdown fields via `escapeHtml()` and `DOMPurify`.

4. **Socket.IO Room & Payload Validation (`server.ts`)**
   - Room IDs are validated as non-empty strings (`<= 128` characters), and Socket.IO state events (`canvas-update`, `canvas-delta`, `dom-elements-update`, `viewport-update`) validate payload structure before broadcasting.
   - Serverless API routes (`api/ai/*.ts`) never expose internal stack traces (`err.stack`) in HTTP 500 responses.

5. **Local-First Credential Privacy**
   - Personal Google AI Studio API keys (`GEMINI_API_KEY`) are stored locally in the user's browser (`localStorage`) or desktop `%APPDATA%\Trido\.env` (in the Electron `.exe` build) and are never logged or persisted on shared servers.

## Reporting a Vulnerability

If you discover a security vulnerability in Trido:
1. **Do not** open a public GitHub issue containing exploit details.
2. Report the finding directly via GitHub Security Advisories on [github.com/Ardelyo/trido/security/advisories](https://github.com/Ardelyo/trido/security/advisories) or contact the maintainer (**Ardellio Satria Anindito** — `@Ardelyo`).
3. Include steps to reproduce, affected file(s) and line numbers, and potential impact. We aim to acknowledge reports within 48 hours and issue a patched release within 7 days.
