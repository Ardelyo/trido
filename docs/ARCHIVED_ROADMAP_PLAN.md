# 🎓 TRIDO MASTER PLAN: Menjadi Teaching Assistant Sungguhan

## Dokumen Perencanaan Komprehensif — Dari Stabilisasi ke Produk Jadi

---

## 📍 Posisi Kita Saat Ini (Baseline Assessment)

```
✅ SELESAI (Foundation Stability):
├── Prompt simplification (viewport-aware grid)
├── Function calling mode reverted ke AUTO (fix critical bug)
├── Input lock saat AI processing (cegah race condition)
├── Fetch timeout 25 detik (cegah infinite hang)
├── Validator bug fix (MAIN_TOPIC enum mismatch)
└── Debug tools (trido.lesson(), trido.mindmap(), dll)

🟡 PARTIAL / PERLU VERIFIKASI:
├── Mindmap expand capability (kode ada, belum full-tested)
├── Lesson session detection (kode ada, belum terintegrasi penuh)
├── connect_nodes garbage filtering (perlu ditambahkan)
└── Model isolation test (Gemini vs Gemma) — belum dilakukan

❌ BELUM ADA (Core Teaching Assistant Features):
├── Lesson Engine yang benar-benar generate full session plan
├── Visual Template Engine (locked structure, konsisten)
├── Subject-specific intelligence (matematika ≠ bahasa ≠ IPA)
├── Incremental slide/step reveal (bukan dump semua sekaligus)
├── Engagement tools (timer diskusi, randomizer, polling)
└── Real teacher testing & feedback loop
```

---

## 🎯 North Star (Definisi "Selesai")

```
Guru buka Trido, ketik/bicara SATU kalimat:
"Hari ini IPA kelas 8, sistem pernapasan"

DALAM 15 DETIK, Trido:
1. Memahami: subject=IPA, topic=sistem pernapasan, grade=8
2. Membuat rencana sesi (5 langkah, ditampilkan di chat)
3. Langsung eksekusi langkah pertama (mindmap/pembuka) di canvas
4. Merespons dengan bahasa natural + tips mengajar

Guru bisa:
- Ketik "lanjut" → sesi lanjut ke langkah berikutnya
- Ketik "tambah detail X" → mindmap expand, TIDAK reset
- Tanya "kenapa X terjadi?" → dapat jawaban teks, BUKAN widget dump
- Ketik "quiz" → dapat quiz KONTEKSTUAL sesuai topik yang sedang dibahas
- Semua visual (mindmap/timeline/flowchart) SELALU rapi, tidak overlap, tidak berantakan
```

---

# 🗺️ PHASE ROADMAP OVERVIEW

```
PHASE 0: Verification & Regression Lock     [1 hari]  ← MULAI DI SINI
PHASE 1: Model Reliability Decision          [1 hari]
PHASE 2: Lesson Engine Core                  [3 hari]
PHASE 3: Visual Template Lock-In             [2 hari]
PHASE 4: Subject Intelligence Layer          [2 hari]
PHASE 5: Engagement & Classroom Tools        [2 hari]
PHASE 6: Full Integration Testing            [2 hari]
PHASE 7: Real Teacher Pilot                  [3-5 hari]

TOTAL: ~15-17 hari kerja fokus
```

---

# PHASE 0: Verification & Regression Lock
### Durasi: 1 hari | Prioritas: 🔴 WAJIB SEBELUM LANJUT

Sebelum membangun fitur baru, kita harus **memastikan fondasi benar-benar solid**. Tidak boleh ada bug lama yang menyamar jadi masalah baru nanti.

## Task 0.1: Jalankan Full Regression Test

Gunakan test protocol yang sudah dibuat sebelumnya, tapi kali ini **dengan checklist ketat**:

```markdown
□ Scene 1: Lesson kickoff → chat response manusiawi (bukan "Menjalankan tindakan")
□ Scene 2: Mindmap structure → tepat 1 MAIN_TOPIC, tidak overlap
□ Scene 3: Expand mindmap → node lama TETAP ADA, tidak reset
□ Scene 4: Pure question → jawaban teks, TIDAK ada canvas action
□ Scene 8: Rapid fire → input terkunci, tidak ada chaos
□ Verifikasi: connect_nodes TIDAK error di console
□ Verifikasi: Tidak ada request yang hang >25 detik
```

## Task 0.2: Fix connect_nodes Garbage Filter (Jika Belum)

**File:** `hooks/useGeminiBrain.ts`

```typescript
// Tambahkan SEBELUM processing connectCalls
const GARBAGE_VALUES = new Set([
  'MAIN_TOPIC', 'SUBTOPIC', 'DETAIL', 'HIGHLIGHT',
  'ROOT', '//ROOT//', '', 'NULL', 'UNDEFINED'
]);

const isValidNodeReference = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  return !GARBAGE_VALUES.has(text.trim().toUpperCase());
};

// Hard rule: jika ada mindmap, buang SEMUA connect_nodes
if (mindmapCalls.length > 0 && connectCalls.length > 0) {
  logger.warn(`[Safety] Dropped ${connectCalls.length} connect_nodes (mindmap auto-connects)`);
  connectCalls = [];
}

// Filter garbage values yang lolos meski tidak ada mindmap
connectCalls = connectCalls.filter(c => {
  const valid = isValidNodeReference(c.args?.fromNodeText) && 
                isValidNodeReference(c.args?.toNodeText);
  if (!valid) {
    logger.warn(`[Safety] Rejected invalid connect_nodes: "${c.args?.fromNodeText}" -> "${c.args?.toNodeText}"`);
  }
  return valid;
});
```

## Task 0.3: Model Isolation Test (WAJIB)

Ini keputusan strategis paling penting sebelum lanjut membangun apapun.

```markdown
### Test Matrix

| Test Case | Gemini (native) | Vertex Gemma-4-31b |
|-----------|:---:|:---:|
| Chat response quality (bukan dry text) | ⬜ | ⬜ |
| connect_nodes garbage values muncul? | ⬜ | ⬜ |
| Mindmap style enum benar (MAIN_TOPIC dll)? | ⬜ | ⬜ |
| Response time rata-rata | ___s | ___s |
| Lesson detection akurat? | ⬜ | ⬜ |
| Bisa follow multi-turn context? | ⬜ | ⬜ |

### Keputusan berdasarkan hasil:
Jika Gemma jauh lebih buruk →
  Opsi A: Gemini jadi default utama, Gemma HANYA untuk offline emergency
  Opsi B: Buat prompt terpisah yang lebih simple khusus untuk Gemma
  Opsi C: Batasi fitur Gemma (no lesson engine, basic shapes only)
```

**Deliverable Phase 0:** Tabel hasil regression test + keputusan strategi model, sebelum lanjut ke Phase 1.

---

# PHASE 1: Model Reliability Decision
### Durasi: 1 hari | Prioritas: 🔴 CRITICAL

Berdasarkan hasil Phase 0, kita implementasikan strategi final untuk multi-provider.

## Task 1.1: Tiered Capability System

**File:** `server/aiTools.ts` — tambahkan capability tiers

```typescript
export interface ModelCapability {
  supportsComplexSchema: boolean;
  maxToolCallsPerRequest: number;
  supportsLessonEngine: boolean;
  recommendedTemperature: number;
}

export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  'gemini-1.5-flash': {
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
    supportsComplexSchema: false,  // ← berdasarkan hasil test
    maxToolCallsPerRequest: 5,     // ← lebih konservatif
    supportsLessonEngine: false,   // ← fallback ke mode simple
    recommendedTemperature: 0.4    // ← lebih deterministic
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
```

## Task 1.2: Adaptive Prompt Berdasarkan Model

**File:** `server/aiTools.ts` — modifikasi `buildSystemInstruction`

```typescript
export const buildSystemInstruction = (
  canvasObjects: CanvasObjectData[],
  viewport: ViewportBounds,
  pageContext?: { current: number; total: number },
  domElements: Record<string, any> = {},
  lessonContext?: LessonContextParam,
  modelCapability?: ModelCapability  // ← BARU
): string => {
  // ... existing grid/context code ...

  const capability = modelCapability || MODEL_CAPABILITIES['gemini-1.5-flash'];

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

  // FULL MODE untuk model capable (existing full prompt)
  return `... (full prompt seperti yang sudah dibuat) ...`;
};
```

**Deliverable Phase 1:** Sistem yang otomatis menyesuaikan kompleksitas prompt berdasarkan model aktif, mencegah model lemah "overload" dengan instruksi yang tidak sanggup dijalankan.

---

# PHASE 2: Lesson Engine Core
### Durasi: 3 hari | Prioritas: 🔴 CORE FEATURE

Ini adalah jantung dari "Teaching Assistant" — bukan sekadar "Content Generator".

## Task 2.1: Lesson Plan Generator (Server-Side)

**File:** `server/lessonEngine.ts` (NEW)

```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('lesson-engine');

export interface LessonStepTemplate {
  phase: 'intro' | 'core' | 'practice' | 'closing';
  title: string;
  contentType: 'mindmap' | 'flowchart' | 'timeline' | 'document' | 'quiz' | 'comparison';
  suggestedPrompt: string; // Internal prompt untuk generate konten
}

// Template rencana pelajaran berdasarkan tipe subject
const LESSON_TEMPLATES: Record<string, (topic: string) => LessonStepTemplate[]> = {
  
  'IPA': (topic) => [
    { phase: 'intro', title: `Pengantar ${topic}`, contentType: 'mindmap', 
      suggestedPrompt: `Buat peta konsep dasar tentang ${topic}` },
    { phase: 'core', title: `Proses/Mekanisme ${topic}`, contentType: 'flowchart',
      suggestedPrompt: `Buat flowchart proses ${topic}` },
    { phase: 'practice', title: 'Latihan Pemahaman', contentType: 'quiz',
      suggestedPrompt: `Buat 3 soal quiz tentang ${topic}` },
    { phase: 'closing', title: 'Rangkuman', contentType: 'document',
      suggestedPrompt: `Buat rangkuman singkat tentang ${topic}` }
  ],

  'Matematika': (topic) => [
    { phase: 'intro', title: `Konsep Dasar ${topic}`, contentType: 'document',
      suggestedPrompt: `Jelaskan konsep dasar ${topic} dengan rumus KaTeX` },
    { phase: 'core', title: 'Contoh Soal & Langkah Penyelesaian', contentType: 'document',
      suggestedPrompt: `Buat 1 contoh soal ${topic} dengan langkah penyelesaian step by step` },
    { phase: 'practice', title: 'Latihan Soal', contentType: 'quiz',
      suggestedPrompt: `Buat 3 soal latihan ${topic}` },
    { phase: 'closing', title: 'Rangkuman Rumus', contentType: 'document',
      suggestedPrompt: `Rangkum semua rumus penting ${topic}` }
  ],

  'IPS': (topic) => [
    { phase: 'intro', title: `Latar Belakang ${topic}`, contentType: 'timeline',
      suggestedPrompt: `Buat timeline peristiwa penting terkait ${topic}` },
    { phase: 'core', title: 'Sebab-Akibat', contentType: 'mindmap',
      suggestedPrompt: `Buat peta konsep sebab-akibat ${topic}` },
    { phase: 'practice', title: 'Diskusi & Analisis', contentType: 'quiz',
      suggestedPrompt: `Buat 3 soal essay analisis tentang ${topic}` },
    { phase: 'closing', title: 'Kesimpulan', contentType: 'document',
      suggestedPrompt: `Buat kesimpulan pembelajaran tentang ${topic}` }
  ],

  'Bahasa Indonesia': (topic) => [
    { phase: 'intro', title: `Pengantar ${topic}`, contentType: 'document',
      suggestedPrompt: `Jelaskan ${topic} secara singkat dan menarik` },
    { phase: 'core', title: 'Unsur & Struktur', contentType: 'mindmap',
      suggestedPrompt: `Buat peta konsep unsur-unsur dalam ${topic}` },
    { phase: 'practice', title: 'Latihan Analisis', contentType: 'quiz',
      suggestedPrompt: `Buat 3 soal pemahaman tentang ${topic}` },
    { phase: 'closing', title: 'Rangkuman', contentType: 'document',
      suggestedPrompt: `Rangkum poin-poin penting tentang ${topic}` }
  ],

  'Bahasa Inggris': (topic) => [
    { phase: 'intro', title: `Introduction to ${topic}`, contentType: 'document',
      suggestedPrompt: `Explain ${topic} briefly in Indonesian with English examples` },
    { phase: 'core', title: 'Vocabulary & Grammar', contentType: 'mindmap',
      suggestedPrompt: `Buat peta konsep vocabulary terkait ${topic}` },
    { phase: 'practice', title: 'Practice Quiz', contentType: 'quiz',
      suggestedPrompt: `Buat 3 soal grammar/vocab tentang ${topic}` },
    { phase: 'closing', title: 'Summary', contentType: 'document',
      suggestedPrompt: `Rangkum poin penting tentang ${topic}` }
  ],

  // Default fallback untuk subject lain
  'default': (topic) => [
    { phase: 'intro', title: `Pengantar ${topic}`, contentType: 'mindmap',
      suggestedPrompt: `Buat peta konsep tentang ${topic}` },
    { phase: 'practice', title: 'Latihan', contentType: 'quiz',
      suggestedPrompt: `Buat 3 soal tentang ${topic}` },
    { phase: 'closing', title: 'Rangkuman', contentType: 'document',
      suggestedPrompt: `Rangkum pembelajaran tentang ${topic}` }
  ]
};

export const generateLessonPlan = (
  subject: string,
  topic: string,
  gradeLevel: string
): LessonStepTemplate[] => {
  const normalizedSubject = Object.keys(LESSON_TEMPLATES).find(
    key => subject.toLowerCase().includes(key.toLowerCase())
  ) || 'default';

  const template = LESSON_TEMPLATES[normalizedSubject](topic);
  logger.info(`Generated lesson plan: ${normalizedSubject} - ${topic} (${template.length} steps)`);
  
  return template;
};
```

## Task 2.2: Lesson Intent Router (Client-Side)

**File:** `hooks/useLessonEngine.ts` (NEW)

```typescript
import { useCallback } from 'react';
import { useStore } from '../store';
import { createLogger } from '../utils/logger';

const logger = createLogger('lesson-hook');

// Subject detection map
const SUBJECT_KEYWORDS: Record<string, string> = {
  'ipa': 'IPA', 'biologi': 'IPA', 'fisika': 'IPA', 'kimia': 'IPA',
  'matematika': 'Matematika', 'mtk': 'Matematika', 'math': 'Matematika',
  'ips': 'IPS', 'sejarah': 'IPS', 'geografi': 'IPS', 'ekonomi': 'IPS',
  'bahasa indonesia': 'Bahasa Indonesia', 'b.indo': 'Bahasa Indonesia',
  'bahasa inggris': 'Bahasa Inggris', 'english': 'Bahasa Inggris',
  'pkn': 'PKN', 'agama': 'Pendidikan Agama'
};

const LESSON_START_PATTERNS = /^(hari ini|materi|topik|belajar|ajar(kan)?|pelajaran)/i;
const GRADE_PATTERN = /kelas\s*(\d+)|grade\s*(\d+)/i;

export interface LessonDetectionResult {
  isLessonStart: boolean;
  subject: string;
  topic: string;
  gradeLevel: string;
  confidence: 'high' | 'medium' | 'low';
}

export const detectLessonIntent = (prompt: string): LessonDetectionResult => {
  const lower = prompt.toLowerCase();
  const hasStartPattern = LESSON_START_PATTERNS.test(prompt.trim());
  
  let detectedSubject = '';
  for (const [keyword, subject] of Object.entries(SUBJECT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      detectedSubject = subject;
      break;
    }
  }

  const gradeMatch = prompt.match(GRADE_PATTERN);
  const gradeLevel = gradeMatch ? `Kelas ${gradeMatch[1] || gradeMatch[2]}` : '';

  // Confidence scoring
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (hasStartPattern && detectedSubject && gradeLevel) confidence = 'high';
  else if (detectedSubject || hasStartPattern) confidence = 'medium';

  const isLessonStart = confidence !== 'low';

  // Extract topic by removing detected keywords
  let topic = prompt;
  if (isLessonStart) {
    topic = prompt
      .replace(LESSON_START_PATTERNS, '')
      .replace(GRADE_PATTERN, '')
      .replace(new RegExp(Object.keys(SUBJECT_KEYWORDS).join('|'), 'gi'), '')
      .replace(/untuk|tentang|kelas/gi, '')
      .trim();
  }

  return {
    isLessonStart,
    subject: detectedSubject || 'Umum',
    topic: topic || prompt,
    gradeLevel: gradeLevel || 'Tidak ditentukan',
    confidence
  };
};

export const useLessonEngine = () => {
  const { lessonPlan, startLesson, advanceLessonPhase, addLog, addMessage } = useStore();

  const handlePotentialLessonStart = useCallback((prompt: string): boolean => {
    const detection = detectLessonIntent(prompt);

    if (!detection.isLessonStart) return false;

    // Jangan restart lesson yang sudah ada topic sama
    if (lessonPlan?.topic === detection.topic) return false;

    startLesson(detection.subject, detection.topic, detection.gradeLevel);
    addLog(`📚 Lesson started: ${detection.subject} - ${detection.topic} (confidence: ${detection.confidence})`);
    
    return true;
  }, [lessonPlan, startLesson, addLog]);

  const isContinueCommand = (prompt: string): boolean => {
    return /^(lanjut|next|continue|lanjutkan|selanjutnya)$/i.test(prompt.trim());
  };

  const isQuizCommand = (prompt: string): boolean => {
    return /^(quiz|kuis|soal|latihan)$/i.test(prompt.trim());
  };

  return {
    handlePotentialLessonStart,
    isContinueCommand,
    isQuizCommand,
    currentLesson: lessonPlan
  };
};
```

## Task 2.3: Integrasi ke useGeminiBrain

**File:** `hooks/useGeminiBrain.ts` — tambahkan di awal `processUserPrompt`

```typescript
import { useLessonEngine, detectLessonIntent } from './useLessonEngine';
import { generateLessonPlan } from '../server/lessonEngine'; // atau duplicate logic di client

export const useGeminiBrain = () => {
  const { setThinking, addAction, addLog, addMessage, setAgentMessage } = useStore();
  const { handlePotentialLessonStart, isContinueCommand, isQuizCommand, currentLesson } = useLessonEngine();
  const isProcessingRef = React.useRef(false);

  const processUserPrompt = useCallback(async (
    prompt: string,
    canvasRef: React.MutableRefObject<any>
  ) => {
    if (isProcessingRef.current) { /* existing lock logic */ return; }
    isProcessingRef.current = true;
    
    if (!canvasRef.current) { isProcessingRef.current = false; return; }
    
    setThinking(true);
    sounds.play('thinking');

    try {
      // ✅ STEP BARU: Deteksi lesson start SEBELUM kirim ke AI
      const wasLessonStart = handlePotentialLessonStart(prompt);
      
      let effectivePrompt = prompt;
      
      if (wasLessonStart) {
        const storeState = useStore.getState();
        const lesson = storeState.lessonPlan!;
        
        // Generate rencana pelajaran (client-side atau panggil endpoint)
        const steps = generateLessonPlan(lesson.subject, lesson.topic, lesson.gradeLevel);
        
        // Update store dengan planned steps
        useStore.setState({
          lessonPlan: {
            ...lesson,
            plannedSteps: steps.map((s, i) => ({
              id: `step_${i}`,
              phase: s.phase,
              title: s.title,
              contentType: s.contentType,
              status: 'planned' as const,
              canvasObjectIds: [],
              suggestion: s.suggestedPrompt
            }))
          }
        });

        // Tampilkan rencana ke chat SEBELUM eksekusi
        const planText = steps.map((s, i) => 
          `${i === 0 ? '▶️' : '⏳'} ${s.title}`
        ).join('\n');
        
        addMessage({ 
          role: 'model', 
          text: `Siap mengajar **${lesson.topic}**! 🎓\n\nRencana sesi:\n${planText}\n\nMemulai dari langkah pertama...` 
        });

        // Gunakan prompt internal untuk step pertama
        effectivePrompt = steps[0].suggestedPrompt;
        
      } else if (isContinueCommand(prompt) && currentLesson) {
        // Cari step berikutnya yang belum dibuat
        const nextStep = currentLesson.plannedSteps.find(s => s.status === 'planned');
        
        if (nextStep) {
          effectivePrompt = nextStep.suggestion;
          addLog(`▶️ Continuing to: ${nextStep.title}`);
        } else {
          addMessage({ role: 'model', text: 'Semua langkah sudah selesai! Ada yang mau ditambahkan?' });
          setThinking(false);
          isProcessingRef.current = false;
          return;
        }
        
      } else if (isQuizCommand(prompt) && currentLesson) {
        // Quiz kontekstual berdasarkan topic aktif
        effectivePrompt = `Buat 3 soal quiz pilihan ganda tentang ${currentLesson.topic}`;
      }

      // ... LANJUTKAN dengan effectivePrompt ke pipeline existing ...
      // (viewport capture, context gathering, AI request, dst — SAMA seperti sebelumnya)
      // Ganti semua penggunaan `prompt` dengan `effectivePrompt` di bagian intent classification dst.

    } catch (error: any) {
      // ... existing error handling
    } finally {
      setThinking(false);
      sounds.stop('thinking');
      isProcessingRef.current = false;
    }
  }, [/* deps */]);

  return { processUserPrompt };
};
```

## Task 2.4: Mark Step Completed Setelah Actions Selesai

**File:** `hooks/useAgentProcessor.ts` — tambahkan callback setelah queue kosong

```typescript
// Setelah semua action di queue selesai diproses:
useEffect(() => {
  if (actionQueue.length === 0 && wasProcessing.current) {
    const { lessonPlan, completeLessonStep } = useStore.getState();
    
    if (lessonPlan) {
      const currentStep = lessonPlan.plannedSteps.find(s => s.status === 'planned');
      if (currentStep) {
        completeLessonStep(currentStep.id, []); // TODO: track actual object IDs
        
        // Cek apakah masih ada step berikutnya
        const hasMore = lessonPlan.plannedSteps.some(
          s => s.id !== currentStep.id && s.status === 'planned'
        );
        
        if (hasMore) {
          useStore.getState().addMessage({
            role: 'model',
            text: `✅ ${currentStep.title} selesai! Ketik "lanjut" untuk langkah berikutnya.`
          });
        }
      }
    }
    wasProcessing.current = false;
  }
  if (actionQueue.length > 0) wasProcessing.current = true;
}, [actionQueue]);
```

**Deliverable Phase 2:** Guru bisa ketik satu kalimat topik, dapat rencana pelajaran, dan bisa lanjut step-by-step dengan "lanjut" tanpa AI kebingungan.

---

# PHASE 3: Visual Template Lock-In
### Durasi: 2 hari | Prioritas: 🔴 CORE (Fix "Berantakan")

## Task 3.1: Timeline Renderer (Belum Ada, Perlu Dibuat)

**File:** `utils/timelineLayout.ts` (NEW)

```typescript
export interface TimelineEvent {
  label: string;
  date?: string;
  description?: string;
}

export interface TimelineLayoutResult {
  x: number;
  y: number;
  label: string;
  date?: string;
  isAbove: boolean; // alternating pattern
}

export const layoutTimeline = (
  events: TimelineEvent[],
  centerX: number,
  centerY: number,
  totalWidth: number = 1000
): TimelineLayoutResult[] => {
  const spacing = totalWidth / Math.max(events.length - 1, 1);
  const startX = centerX - totalWidth / 2;

  return events.map((event, idx) => ({
    x: startX + idx * spacing,
    y: centerY,
    label: event.label,
    date: event.date,
    isAbove: idx % 2 === 0 // alternating above/below the line
  }));
};
```

**File:** `hooks/useGeminiBrain.ts` — tambahkan handling untuk timeline

```typescript
// Tool baru di aiTools.ts: add_timeline_event
// Processing di useGeminiBrain.ts mirip mindmap tapi pakai layoutTimeline
```

**File:** `server/aiTools.ts` — tambahkan tool baru

```typescript
{
  name: "add_timeline_event",
  description: "Add an event to a chronological timeline. Use for historical sequences, process steps over time.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING, description: "Event name" },
      date: { type: Type.STRING, description: "Date or period (e.g. '1945', 'Tahap 1')" },
      order: { type: Type.NUMBER, description: "Sequence order, starting from 0" }
    },
    required: ["label", "order"]
  }
}
```

## Task 3.2: Flowchart Renderer (Belum Ada, Perlu Dibuat)

**File:** `utils/flowchartLayout.ts` (NEW)

```typescript
export interface FlowchartStep {
  text: string;
  type: 'START' | 'PROCESS' | 'DECISION' | 'END';
  order: number;
}

export interface FlowchartLayoutResult {
  x: number;
  y: number;
  text: string;
  type: string;
  width: number;
  height: number;
}

export const layoutFlowchart = (
  steps: FlowchartStep[],
  centerX: number,
  startY: number,
  verticalSpacing: number = 120
): FlowchartLayoutResult[] => {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  return sorted.map((step, idx) => {
    const isDecision = step.type === 'DECISION';
    return {
      x: centerX,
      y: startY + idx * verticalSpacing,
      text: step.text,
      type: step.type,
      width: isDecision ? 160 : 180,
      height: isDecision ? 90 : 60
    };
  });
};
```

**File:** `server/aiTools.ts` — tambahkan tool

```typescript
{
  name: "add_flowchart_step",
  description: "Add a step to a process flowchart. Use for sequential procedures, decision trees, algorithms.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "Step description" },
      type: { 
        type: Type.STRING, 
        enum: ["START", "PROCESS", "DECISION", "END"],
        description: "Step type. Use START once at beginning, END once at finish."
      },
      order: { type: Type.NUMBER, description: "Sequence position, starting from 0" }
    },
    required: ["text", "type", "order"]
  }
}
```

## Task 3.3: Auto Zoom-to-Fit Setelah Render

**File:** `hooks/useAgentProcessor.ts` — tambahkan setelah semua actions selesai

```typescript
const zoomToFitContent = (canvas: fabric.Canvas, objectIds: string[]) => {
  if (objectIds.length === 0) return;
  
  const objects = canvas.getObjects().filter((o: any) => objectIds.includes(o.id));
  if (objects.length === 0) return;

  // Calculate bounding box of all created objects
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objects.forEach((obj: any) => {
    const bound = obj.getBoundingRect();
    minX = Math.min(minX, bound.left);
    minY = Math.min(minY, bound.top);
    maxX = Math.max(maxX, bound.left + bound.width);
    maxY = Math.max(maxY, bound.top + bound.height);
  });

  const padding = 100;
  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;
  
  const zoomX = canvas.width! / contentWidth;
  const zoomY = canvas.height! / contentHeight;
  const zoom = Math.min(zoomX, zoomY, 1.2); // cap max zoom

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  canvas.zoomToPoint({ x: canvas.width! / 2, y: canvas.height! / 2 } as any, zoom);
  canvas.absolutePan({
    x: centerX * zoom - canvas.width! / 2,
    y: centerY * zoom - canvas.height! / 2
  } as any);
  
  canvas.renderAll();
};

// Panggil setelah queue processing selesai (di useEffect yang sama dengan Task 2.4)
```

## Task 3.4: Orphan Object Cleanup

**File:** `hooks/useAgentProcessor.ts`

```typescript
const cleanupOrphanObjects = (canvas: fabric.Canvas) => {
  const objects = canvas.getObjects();
  const toRemove: any[] = [];
  
  objects.forEach((obj: any) => {
    // Tiny unlabeled circles yang bukan node/cursor
    if (
      obj.type === 'circle' && 
      (obj.radius || 0) < 8 &&
      !obj.id?.startsWith('mm_') &&
      obj.id !== 'agent_cursor'
    ) {
      toRemove.push(obj);
    }
  });

  toRemove.forEach(obj => canvas.remove(obj));
  if (toRemove.length > 0) {
    canvas.renderAll();
    logger.info(`Cleaned up ${toRemove.length} orphan objects`);
  }
};
```

**Deliverable Phase 3:** Timeline dan flowchart bisa dibuat AI dengan struktur terkunci rapi, canvas auto-zoom ke konten baru, tidak ada objek nyasar.

---

# PHASE 4: Subject Intelligence Layer
### Durasi: 2 hari | Prioritas: 🟡 HIGH

## Task 4.1: Subject-Aware Visual Selection di Prompt

**File:** `server/aiTools.ts` — perkuat instruksi visual selection

```typescript
// Tambahkan section di system prompt (mode full/capable model):

## SUBJECT-SPECIFIC VISUAL RULES (MANDATORY)

Bahasa Indonesia / Sastra:
- Penjelasan puisi/cerpen/novel → add_component DOCUMENT_PAGE dulu (analisis), 
  BARU tawarkan mindmap unsur intrinsik jika diminta detail
- JANGAN langsung buat mindmap untuk pertanyaan "jelaskan puisi X"

Matematika:
- Rumus/konsep → DOCUMENT_PAGE dengan KaTeX
- Soal cerita → flowchart step penyelesaian (add_flowchart_step)
- JANGAN gunakan mindmap untuk konsep matematika linear

IPA/Sains:
- Konsep/struktur → mindmap (add_mindmap_node)
- Proses/mekanisme → flowchart (add_flowchart_step)
- Klasifikasi → mindmap dengan hierarchy

IPS/Sejarah:
- Peristiwa berurutan waktu → timeline (add_timeline_event)
- Sebab-akibat → mindmap
- Perbandingan → DOCUMENT_PAGE dengan tabel markdown

Bahasa Inggris:
- Vocabulary → FLASHCARD atau mindmap
- Grammar rules → DOCUMENT_PAGE dengan contoh
- Practice → QUIZ_MULTIPLE_CHOICE
```

## Task 4.2: Post-Generation Sanity Check

**File:** `hooks/useGeminiBrain.ts` — tambahkan validator subject-visual mismatch

```typescript
const validateSubjectVisualMatch = (
  functionCalls: any[],
  subject: string,
  prompt: string
): { warning?: string } => {
  const isLiteraryRequest = /puisi|cerpen|novel|sastra|prosa/i.test(prompt);
  const hasMindmap = functionCalls.some(c => c.name === 'add_mindmap_node');
  const hasDocument = functionCalls.some(c => 
    c.name === 'add_component' && c.args?.componentType === 'DOCUMENT_PAGE'
  );

  if (isLiteraryRequest && hasMindmap && !hasDocument) {
    logger.warn('[Subject Mismatch] Literary request got mindmap without document explanation');
    return { warning: 'Sepertinya AI langsung buat mindmap untuk pertanyaan sastra. Mempertimbangkan untuk minta penjelasan teks dulu.' };
  }

  return {};
};

// Panggil setelah menerima functionCalls, log warning jika ada (untuk analytics, tidak block eksekusi)
```

**Deliverable Phase 4:** AI tidak lagi asal pukul rata semua request jadi mindmap — setiap subject dapat treatment visual yang sesuai konteks pedagogis.

---

# PHASE 5: Engagement & Classroom Tools
### Durasi: 2 hari | Prioritas: 🟢 MEDIUM (Value-Add)

## Task 5.1: Quick Action Floating Bar

**File:** `components/QuickTeacherActions.tsx` (NEW)

```tsx
import React from 'react';
import { useStore } from '../store';
import { Timer, Users, HelpCircle, ArrowRight } from 'lucide-react';

export const QuickTeacherActions: React.FC = () => {
  const { lessonPlan, isThinking } = useStore();
  
  if (!lessonPlan) return null;

  const nextStep = lessonPlan.plannedSteps.find(s => s.status === 'planned');

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-2 bg-white shadow-lg rounded-full px-4 py-2 border">
      {nextStep && (
        <button
          disabled={isThinking}
          onClick={() => window.dispatchEvent(new CustomEvent('trido-quick-action', { detail: 'lanjut' }))}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm disabled:opacity-50"
        >
          <ArrowRight size={14} /> Lanjut: {nextStep.title}
        </button>
      )}
      
      <button
        disabled={isThinking}
        onClick={() => window.dispatchEvent(new CustomEvent('trido-quick-action', { detail: 'quiz' }))}
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm disabled:opacity-50"
      >
        <HelpCircle size={14} /> Quiz Sekarang
      </button>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent('trido-start-timer', { detail: 300 }))}
        className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm"
      >
        <Timer size={14} /> Diskusi 5 Menit
      </button>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent('trido-random-picker'))}
        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm"
      >
        <Users size={14} /> Pilih Murid
      </button>
    </div>
  );
};
```

## Task 5.2: Random Student Picker (Simple Engagement Tool)

**File:** `components/RandomPickerTool.tsx` (NEW)

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const RandomPickerTool: React.FC<{ studentNames: string[]; onClose: () => void }> = ({ 
  studentNames, 
  onClose 
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    setIsSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setSelected(studentNames[Math.floor(Math.random() * studentNames.length)]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-center min-w-[300px]">
        <h3 className="text-lg font-bold mb-4">🎲 Pilih Murid</h3>
        <div className="text-3xl font-bold text-blue-600 mb-6 h-12">
          {selected || '...'}
        </div>
        <button
          onClick={spin}
          disabled={isSpinning}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {isSpinning ? 'Memilih...' : 'Putar!'}
        </button>
        <button onClick={onClose} className="mt-2 text-sm text-gray-500">Tutup</button>
      </div>
    </div>
  );
};
```

**Deliverable Phase 5:** Guru punya tombol cepat untuk aksi umum tanpa harus ketik, meningkatkan engagement kelas secara langsung.

---

# PHASE 6: Full Integration Testing
### Durasi: 2 hari | Prioritas: 🔴 WAJIB SEBELUM PILOT

## Task 6.1: Comprehensive Scenario Test Matrix

Gabungkan semua fitur dalam satu simulasi realistis penuh:

```markdown
### FULL CLASSROOM SIMULATION SCRIPT (30 menit simulasi)

00:00 - "Hari ini IPA kelas 8, sistem pernapasan manusia"
        → Verify: lesson plan muncul, step 1 auto-execute

02:00 - [Guru menjelaskan manual di depan kelas, tidak input apapun]

03:00 - "Lanjut"
        → Verify: step 2 (flowchart) muncul, step 1 tetap ada

05:00 - "Tambahkan detail tentang alveolus"
        → Verify: mindmap expand, bukan reset

07:00 - "Kenapa pertukaran oksigen terjadi di alveolus?"
        → Verify: jawaban teks, TIDAK ada canvas action baru

09:00 - "Buatkan quiz"
        → Verify: quiz KONTEKSTUAL tentang pernapasan, bukan random

12:00 - [Guru pakai Quick Action "Diskusi 5 Menit"]
        → Verify: timer muncul dan berjalan

17:00 - "Lanjut"
        → Verify: closing step (rangkuman) muncul

20:00 - Ganti topik: "Sekarang bahasa Indonesia, puisi Aku karya Chairil Anwar"
        → Verify: lesson baru dimulai, subject terdeteksi benar,
          visual yang muncul SESUAI (document dulu, bukan mindmap acak)

25:00 - Rapid test: ketik 3 command cepat berturut-turut
        → Verify: tidak ada chaos, input terkunci dengan benar

30:00 - Cek: trido.dump() → semua state konsisten, tidak ada orphan data
```

## Task 6.2: Performance Benchmark

```markdown
| Metric | Target | Actual |
|--------|--------|--------|
| Lesson start response time | <8s | ___ |
| Mindmap expand response time | <6s | ___ |
| Question-only response time | <5s | ___ |
| Quiz generation time | <6s | ___ |
| Zero console errors during full script | Yes | ___ |
| Zero orphan objects on canvas | Yes | ___ |
```

**Deliverable Phase 6:** Scorecard lengkap yang membuktikan seluruh sistem bekerja sebagai satu kesatuan yang koheren, bukan fitur-fitur terpisah yang kebetulan tidak crash.

---

# PHASE 7: Real Teacher Pilot
### Durasi: 3-5 hari | Prioritas: 🔴 VALIDASI FINAL

Ini yang paling penting — **tidak ada jumlah testing internal yang menggantikan feedback guru sungguhan**.

## Task 7.1: Rekrut 2-3 Guru untuk Pilot

```markdown
Kriteria ideal:
- Minimal 1 guru "gaptek" (level 1-2 dari skala yang kita diskusikan)
- Minimal 1 guru dari mapel non-sains (Bahasa/IPS) — untuk validasi subject intelligence
- Akses ke kelas nyata atau simulasi dengan murid (bisa keluarga/tetangga untuk simulasi)
```

## Task 7.2: Structured Feedback Form

```markdown
Setelah pilot session, tanyakan:

1. Dari skala 1-10, seberapa mudah pakai Trido tanpa training?
2. Bagian mana yang paling membingungkan?
3. Apakah visual yang dihasilkan sudah sesuai ekspektasi mengajar?
4. Apakah kamu akan pakai Trido lagi minggu depan? Kenapa/kenapa tidak?
5. Fitur apa yang paling terasa BERMANFAAT (bukan sekadar keren)?
6. Fitur apa yang terasa TIDAK PERLU / mengganggu?
```

## Task 7.3: Bug/Friction Log dari Observasi Langsung

```markdown
Duduk di samping guru saat mereka pakai (jangan bantu kecuali diminta):
- Catat SETIAP kali guru bingung/ragu
- Catat SETIAP kali guru mengulang aksi yang sama
- Catat SETIAP kali guru bilang "harusnya gini deh..."
```

**Deliverable Phase 7:** Data nyata untuk prioritas iterasi berikutnya — di titik ini kita tahu apakah Trido benar-benar "teaching assistant" atau masih "AI demo yang keren".

---

# 📊 Master Timeline Summary

```
Minggu 1:
├── Hari 1: Phase 0 (Verification & Regression)
├── Hari 2: Phase 1 (Model Reliability)
├── Hari 3-5: Phase 2 (Lesson Engine Core)

Minggu 2:
├── Hari 6-7: Phase 3 (Visual Template Lock-In)
├── Hari 8-9: Phase 4 (Subject Intelligence)
├── Hari 10-11: Phase 5 (Engagement Tools)

Minggu 3:
├── Hari 12-13: Phase 6 (Integration Testing)
├── Hari 14-18: Phase 7 (Real Teacher Pilot)

TOTAL: ~18 hari kerja fokus (bisa dipercepat jika kerja intensif)
```

---

# 🎯 Definition of Done — Full Checklist

```markdown
□ Guru bisa mulai lesson dengan 1 kalimat, dapat rencana + eksekusi otomatis
□ Mindmap SELALU bisa di-expand, tidak pernah reset tanpa diminta
□ Timeline dan Flowchart tersedia sebagai visual pilihan, terstruktur rapi
□ Pertanyaan sederhana dijawab teks, TIDAK auto-generate widget
□ Quiz SELALU kontekstual dengan topik aktif
□ Setiap subject dapat treatment visual yang sesuai (bukan mindmap untuk semua)
□ Tidak ada bug rapid-fire, race condition, atau infinite hang
□ Minimal 2 guru pilot memberi rating ≥7/10 untuk "kemudahan pakai"
□ Minimal 1 guru bilang "saya akan pakai ini lagi minggu depan"
```

---

## 🚦 Langkah Pertama Kamu Sekarang

**Mulai dari Phase 0, Task 0.3 (Model Isolation Test).** Ini keputusan strategis yang akan mempengaruhi SEMUA phase berikutnya.

Jalankan test perbandingan Gemini vs Gemma yang sudah dijelaskan, lalu share hasilnya. Dari situ kita bisa konfirmasi apakah Phase 1 (Model Reliability) perlu effort besar atau bisa disederhanakan.

**Sambil menunggu itu, saya bisa mulai siapkan kode lengkap untuk Phase 2 (Lesson Engine)** — karena ini independent dari keputusan model, dan merupakan fitur paling berdampak untuk mengubah Trido dari "demo AI" menjadi "teaching assistant".

Mau saya lanjutkan detail implementasi Phase 2 sekarang, atau kamu mau jalankan Phase 0 dulu dan share hasilnya? 🚀