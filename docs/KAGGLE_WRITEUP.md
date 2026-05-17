# Trido: A Voice-Driven AI Whiteboard Built for the Teacher Nobody Builds For

**Track:** Future of Education | Digital Equity & Inclusivity | Ollama Special Track

---

## The Problem Is Not Technology

In Bandung, Indonesia, there is a Bahasa Indonesia teacher named Dadan Mochammad Ramdhan. Everyone calls him Pak Damar. He has been teaching for years — he knows his material cold, he knows how to read a classroom, and he genuinely cares about his students in the way that stays with them long after they've forgotten the curriculum.

Pak Damar has physical disabilities affecting both his hands and legs.

Every day, he navigates teaching tools designed for someone who can drag, click, scroll, hold, resize, and type simultaneously. Tools where the accessibility mode is an afterthought bolted on after the product shipped. Tools where "inclusive design" means adding keyboard shortcuts nobody told you about.

This is not a technology gap. There are more AI-powered tools now than anyone can count. The gap is attention — who gets built for, and who doesn't.

Trido exists because of Pak Damar. Not as a case study. As the primary user who tested it in real classes, told us what was wrong, and kept using it anyway. That's how we knew it was working.

---

## What Trido Is

Trido is a voice-first AI-powered digital whiteboard for teachers. The teacher speaks — naturally, in Bahasa Indonesia or English — and the board builds itself. Mind maps, quizzes, document summaries, timers, interactive simulations: all generated on demand and placed on an infinite canvas that students watch live in any browser.

The name: **Tri** (Teacher, Student, Technology) + **Do** (just make it work).

The core experience is designed for a teacher who cannot — or prefers not to — use a mouse and keyboard while standing in front of a classroom. Trido eliminates that requirement.

---

## How We Use Gemma 4

The application routes AI requests through **gemma-4-31b-it** via the `@google/genai` SDK for cloud inference, and **gemma4:e2b** via Ollama for local offline inference. Both are Gemma 4 family models, selected specifically because:

1. **Function calling support** — the entire canvas control system is built on structured function calls, not prompt-parsed free text
2. **Multilingual capability** — Pak Damar's students are taught in Bahasa Indonesia; the model handles this natively with no fine-tuning
3. **gemma4:e2b for edge** — 2B parameters fit comfortably in 4GB RAM, making offline classroom use viable on modest hardware

### The Function Calling Architecture

Each teacher request triggers a structured AI call that includes:
- The teacher's spoken/typed prompt
- A screenshot of the current canvas state (base64 PNG)
- A JSON list of all existing canvas objects with their IDs, positions, and content
- The current page index and total pages

The model responds with one or more function calls from a defined tool schema. The tools include:

```
add_mindmap_node(text, relativePosition, style)
connect_nodes(fromNodeText, toNodeText, lineStyle)
add_component(componentType, gridPosition, configJson)
add_text_label(text, gridPosition, size)
add_interactive_app(title, html, css, js, gridPosition)
pan_camera(targetObjectId, direction)
modify_object(objectId, action, value)
```

These get enqueued and executed by an agent processor that animates a cursor along Bezier curves to each target position before performing the action. Students see the AI "thinking" and "doing" in real time — which turns out to be pedagogically useful, not just visually interesting.

### Offline Mode via Ollama

For schools without reliable internet — which describes most of the classrooms where Trido matters most — the app detects Ollama running locally and routes there instead. The switch is automatic and seamless. A teacher in a classroom with spotty WiFi sets `AI_MODE=ollama` once, downloads `gemma4:e2b` once, and then teaches for months without depending on cloud availability.

This is the Ollama integration: not a checkbox, but the actual deployment mode that made Trido viable for Pak Damar's school.

---

## The Technical Architecture

```
Browser (React + Fabric.js)
    ↓ voice / text input
ChatInterface → useGeminiBrain
    ↓ POST /api/ai/generate (canvas state as context)
Express Server → aiRouter
    ↓ routes to provider
geminiAdapter (@google/genai SDK)  OR  ollamaAdapter (REST)
    ↓ function call response
useAgentProcessor (action queue)
    ↓ Bezier-animated cursor + Fabric.js canvas mutations
DomOverlay (widget rendering)
    ↓ Socket.IO broadcast
Connected student browsers
```

**Voice pipeline:** Web Speech API provides instant transcript preview. In parallel, MediaRecorder captures audio. If the browser's speech recognition produces a low-confidence result (or misses entirely in a noisy room), the recorded audio goes to Gemini transcription as fallback. Both paths fire simultaneously; the more confident result wins.

**Session persistence:** Auto-saved to IndexedDB every 3 seconds via `idb-keyval`. Board state survives refresh, tab close, and browser restart. Multi-page sessions store each page's canvas JSON and DOM widget state separately.

**Real-time collaboration:** Socket.IO rooms. When the teacher's canvas updates, the diff broadcasts to all connected viewers. Students don't need an account — they join via URL with a room code. Latency is typically under 500ms.

---

## What Got Built, What Actually Gets Used

During Pak Damar's testing sessions, we discovered some things:

The features that got used most: mind maps (every class), quizzes (multiple times per week), the countdown timer (constantly — students respond to visible time pressure), and document summaries at end-of-class.

The features that sounded impressive in planning but were less used: the interactive app generator. When it works — a physics simulation, a drag-and-match vocabulary game — it's genuinely powerful. But generating a complete working app from voice takes 10-15 seconds, and classroom time is zero-waste. It became a "special feature" for prepared lessons, not ad-hoc use.

The thing nobody expected to matter: the animated cursor. When the AI builds a mind map and the cursor visibly moves from node to node, students track it. They pay attention in a different way than they do watching a static board fill up. It's not just UX decoration — it functions like showing your work.

---

## Inclusion Is the Point

The digital equity framing of this project is not a track selection. It's the foundation.

Most accessibility-focused tools are retrofitted — they add voice control as an alternative pathway to an interface designed without it. Trido is inverted: voice is the primary interface, and everything else is secondary.

The physical UI (click, drag, keyboard) still exists and works. But the teacher who cannot use it precisely — because of tremor, limited range of motion, prosthetics, fatigue, or any of the hundred reasons human bodies differ — doesn't feel the absence of something they were supposed to have. Voice is first-class.

Pak Damar used the phrase "saya bisa ngajar penuh sekarang" — roughly, "I can teach fully now." That's the metric. Not task completion rate, not API latency, not user engagement score.

Fully.

---

## Why Gemma 4 Specifically

The transition to Gemma 4 family models was significant for two reasons:

**Function call reliability.** Earlier experiments with smaller models (including previous Gemma versions) produced function calls with inconsistent argument formatting — the AI would call `add_mindmap_node` but pass the position as a string when an enum was expected, or skip required parameters. Gemma 4's improvements in instruction following made the structured output reliable enough for a tool where a bad function call drops silently and leaves the teacher wondering why nothing happened.

**Multilingual without prompting.** The system prompt is in English. The teacher speaks in Bahasa Indonesia. The model responds with English function calls. This cross-lingual reasoning worked out of the box with Gemma 4 — no separate translation step, no language-detection routing, no fine-tuning on Indonesian data.

---

## What's Next

Trido is a working product today. The things on the roadmap are extensions of what's already real:

- Persistent AI memory across sessions (the model remembering that Pak Damar's class is covering Chapter 7 this week)
- Student interaction feedback (quiz results flowing back to a teacher dashboard)
- Finer-grained accessibility controls (adjustable target sizes, high-contrast canvas themes)
- Lighter Gemma 4 quantized models for even lower-RAM devices

But none of that is more important than keeping Pak Damar in the loop. He's not a beta tester. He's the co-author of what Trido actually needs to be.

---

## Resources

- **Code:** [github.com/Ardelyo/smartboard-teach-ai](https://github.com/Ardelyo/smartboard-teach-ai)
- **Live Demo:** [trido.vercel.app](https://trido.vercel.app)
- **Video:** [YouTube — Trido Classroom Demo](https://youtube.com)

---

*Built in Indonesia, for a classroom in Bandung.*
*Technology is everywhere. Attention is not.*
