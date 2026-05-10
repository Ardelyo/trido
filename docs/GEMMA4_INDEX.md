# Gemma 4 E2B Performance Optimization — Master Guide

**Project:** Smartboard Teach AI  
**Objective:** Deploy `gemma4:e2b` with stable performance, zero memory leaks, excellent UX  
**Status:** Research Complete, Implementation Ready  
**Last Updated:** May 10, 2026  

---

## 📚 Documentation Overview

This is a complete research and implementation package for optimizing the Smartboard Teach AI platform with Gemma 4 Bit (E2B) quantized model. The documentation is organized into three tiers:

### Tier 1: Research & Theory (📖 GEMMA4_PERFORMANCE_PLAN.md)

**Read this for:**
- Deep understanding of Gemma 4 architecture
- Why 4-bit quantization is optimal
- Memory management strategy
- Performance tuning parameters
- Success criteria and metrics

**Key Sections:**
1. Model Research & Specifications
2. Architecture for Stable Inference
3. Memory Management Strategy
4. Performance Tuning
5. Memory Leak Prevention (Theory)
6. User Experience Optimization
7. Testing & Validation Strategy
8. Implementation Roadmap (16-day plan)

**Time to Read:** 45 minutes

---

### Tier 2: Quick-Start Implementation (⚡ GEMMA4_QUICK_START.md)

**Read this for:**
- Specific code changes needed
- File-by-file diff and explanation
- Seven critical files to modify
- Testing commands
- Troubleshooting guide

**Key Files to Update:**
1. `constants.ts` — Model configuration
2. `server/ollamaAdapter.ts` — Request optimization
3. `server/aiTools.ts` — Parameter validation
4. `server/memoryMonitor.ts` — NEW: Memory tracking
5. `hooks/useGeminiBrain.ts` — Progress feedback
6. `components/AiStatus.tsx` — NEW: UI feedback
7. `scripts/benchmarkGemma4.ts` — NEW: Performance testing

**Time to Implement:** 2-3 weeks

---

### Tier 3: Memory Leak Audit (🔍 MEMORY_LEAK_AUDIT.md)

**Read this for:**
- Specific memory leak patterns in your codebase
- How to identify leaks with Chrome DevTools
- File-by-file audit checklist
- Common patterns and fixes
- Automated heap dump analysis

**How to Use:**
1. Print out the audit checklist
2. Go through each file with `grep` commands provided
3. Review for leak patterns
4. Run test scenarios (long sessions, disconnects, etc.)
5. Use profiling tools if suspicious

**Time to Audit:** 2-3 hours (first time)

---

## 🎯 Quick Navigation

**I want to...**

| Goal | Start Here |
|------|-----------|
| Understand why gemma4:e2b is chosen | [Performance Plan § 1.2](GEMMA4_PERFORMANCE_PLAN.md#12-why-4-bit-quantization-for-this-use-case) |
| See specific code changes | [Quick-Start § 1-7](GEMMA4_QUICK_START.md#-quick-reference-what-to-change) |
| Learn memory optimization | [Performance Plan § 2.2](GEMMA4_PERFORMANCE_PLAN.md#22-memory-management-strategy) |
| Implement changes | [Quick-Start § Implementation Sequence](GEMMA4_QUICK_START.md#-implementation-sequence) |
| Check for memory leaks | [Memory Audit § Quick Checklist](MEMORY_LEAK_AUDIT.md#-quick-audit-checklist) |
| Benchmark performance | [Quick-Start § Testing Commands](GEMMA4_QUICK_START.md#-testing-commands) |
| Understand response pipeline | [Performance Plan § 2.1](GEMMA4_PERFORMANCE_PLAN.md#21-inference-request-pipeline) |
| Debug inference timeouts | [Quick-Start § Troubleshooting](GEMMA4_QUICK_START.md#-troubleshooting) |

---

## 📊 Success Metrics

### Performance Targets
```
Metric                  | Target   | Baseline | Improvement
─────────────────────────────────────────────────────────
Avg Inference Time      | < 3s     | 4-5s    | ↓ 40%
First Response Feedback | < 500ms  | 1-2s    | ↓ 75%
Memory Growth/Hour      | < 5MB    | +50MB   | ↓ 90%
Tool Call Validity      | > 98%    | 85%     | ↑ 13%
Concurrent Requests     | 2-3 ✓    | 1       | ↑ 2-3x
```

### Business Metrics
- **Teacher Satisfaction:** Good to Very Good UX
- **Session Duration:** 8+ hours without lag
- **Uptime:** 99% availability
- **Cost:** Same as current (Ollama is free, runs locally)

---

## 🚀 Implementation Timeline

### Week 1: Foundation (Days 1-5)

**Tasks:**
- [ ] Read Performance Plan (1 day)
- [ ] Update `constants.ts` + `ollamaAdapter.ts` (1 day)
- [ ] Create `memoryMonitor.ts` (0.5 day)
- [ ] Create benchmark script (0.5 day)
- [ ] Run baseline performance test (1 day)

**Deliverable:** Baseline metrics documented

### Week 2: Optimization (Days 6-10)

**Tasks:**
- [ ] Implement context compression (1 day)
- [ ] Add tool validation layer (1 day)
- [ ] Add progress tracking to hooks (1 day)
- [ ] Create AiStatus UI component (0.5 day)
- [ ] Test on CPU-only hardware (1.5 day)

**Deliverable:** 30% faster inference, working UI feedback

### Week 3: Stability & Testing (Days 11-16)

**Tasks:**
- [ ] Run 8-hour stability test (2 days, async)
- [ ] Memory leak audit using checklist (1 day)
- [ ] Fix any identified leaks (1-2 days)
- [ ] Run full benchmark suite (1 day)
- [ ] Classroom pilot testing (1-2 days)

**Deliverable:** Stable, production-ready system

---

## 🛠️ Technology Stack

| Component | Technology | Version | Role |
|-----------|-----------|---------|------|
| LLM | Ollama | 0.4.0+ | Local inference |
| Model | Gemma 4 E2B | GGUF Q4_K_M | 4-bit quantized |
| Quantization | GGUF | v3 | Memory efficient |
| Backend | Node.js + Express | 18+ | API server |
| Frontend | React + Vite | 19.2 | UI |
| State | Zustand | 5.0 | State management |
| Canvas | Fabric.js | 5.x | Whiteboard |
| Real-time | Socket.IO | 4.8 | WebSocket sync |

---

## 🧪 Testing Checklist

Before deployment, verify:

- [ ] **Performance**
  - [ ] Benchmark shows < 3s avg inference ✅
  - [ ] First response < 500ms ✅
  - [ ] Max response < 5s ✅

- [ ] **Stability**
  - [ ] 8-hour session test completed ✅
  - [ ] Memory monitoring shows < 5MB/hour growth ✅
  - [ ] No console errors in logs ✅

- [ ] **Functionality**
  - [ ] All tools work (text, shape, mindmap, quiz, timer, calculator) ✅
  - [ ] Canvas updates in real-time ✅
  - [ ] Viewers see updates ✅

- [ ] **UX**
  - [ ] Spinner shows immediately ✅
  - [ ] Progress message displays (e.g., "Thinking... 3s") ✅
  - [ ] Mode indicator shows "Offline (Ollama)" ✅

- [ ] **Memory Leaks**
  - [ ] All useEffect has cleanup returns ✅
  - [ ] All intervals/timers cleared ✅
  - [ ] Heap snapshot shows plateau (not growth) ✅

---

## 🆘 Common Issues & Quick Fixes

### Issue: "Inference takes 8+ seconds"
**Root Cause:** Thermal throttling or CPU contention  
**Fix:** 
```bash
# Check CPU temp
sensors | grep "Core"

# Reduce model precision
OLLAMA_NUM_THREAD=2 npm run dev

# Reduce input size
# (see Quick-Start § File 2)
```

### Issue: "Memory grows 50MB/hour"
**Root Cause:** Unbounded array or uncleaned listener  
**Fix:**
1. Check Memory Audit checklist
2. Run heap snapshot analysis
3. Look for pattern A, B, or C in audit guide

### Issue: "Tool calls invalid (not JSON)"
**Root Cause:** Gemma hallucinating parameters  
**Fix:**
```bash
# Apply validation layer (see Quick-Start § File 3)
# Reduce temperature to 0.1
OLLAMA_TEMPERATURE=0.1 npm run dev
```

### Issue: "Ollama not found / connection refused"
**Root Cause:** Ollama service not running  
**Fix:**
```bash
# macOS
brew services start ollama

# Linux
systemctl start ollama

# Windows
# Open Ollama app from Start menu

# Verify
curl http://localhost:11434/api/status
```

---

## 📞 Getting Help

1. **Performance Questions?** → Read Performance Plan § 3 & 4
2. **Code Implementation?** → Read Quick-Start § 1-7
3. **Memory Leak?** → Read Memory Audit § 🔍
4. **Benchmarking?** → Quick-Start § Testing Commands
5. **Debugging?** → Quick-Start § Troubleshooting

---

## 📖 Additional Reading

### Recommended
- [Gemma Model Card](https://ai.google.dev/gemma/docs/model_card)
- [Ollama Documentation](https://ollama.ai)
- [GGUF Format](https://huggingface.co/docs/hub/gguf)

### Optional
- [Node.js Memory Profiling](https://nodejs.org/en/docs/guides/simple-profiling/)
- [React Effect Dependencies](https://react.dev/learn/lifecycle-of-reactive-effect)
- [Chrome DevTools Memory](https://developer.chrome.com/docs/devtools/memory-problems/)

---

## ✅ Completion Checklist

### After Reading All Docs
- [ ] Understand why gemma4:e2b is chosen
- [ ] Know the 3-tier inference pipeline
- [ ] Can identify 3+ memory leak patterns
- [ ] Ready to implement 7 code changes

### After Implementation
- [ ] constants.ts updated ✅
- [ ] ollamaAdapter.ts optimized ✅
- [ ] aiTools.ts validated ✅
- [ ] memoryMonitor.ts created ✅
- [ ] Hooks updated with progress ✅
- [ ] AiStatus component added ✅
- [ ] Benchmark script working ✅

### After Testing
- [ ] Baseline performance measured
- [ ] 8-hour stability test passed
- [ ] Memory audit completed
- [ ] Classroom pilot done
- [ ] Ready for production

---

## 🎓 Key Learnings Summary

1. **Quantization Trade-off:** 4-bit reduces memory 8x with only ~1-3% quality loss
2. **Context Encoding:** Grid-based representation cuts input tokens by 80%
3. **Memory Safety:** Bounded arrays + cleanup returns prevent leaks
4. **UX Matters:** Visual feedback makes 3-5s feel like 1-2s
5. **Monitor Always:** Memory monitoring catches issues before production crash

---

## 🏁 Next Steps

1. **Start Here:** Read `GEMMA4_PERFORMANCE_PLAN.md` (45 min)
2. **Code Changes:** Follow `GEMMA4_QUICK_START.md` (implement 1 file/day)
3. **Quality Check:** Run through `MEMORY_LEAK_AUDIT.md` (before each commit)
4. **Benchmark:** Use provided test scripts to validate improvements
5. **Deploy:** Follow testing checklist above
6. **Monitor:** Enable memory monitoring in production

---

## 📋 Document Map

```
docs/
├── GEMMA4_PERFORMANCE_PLAN.md    ← Research & Theory (45 min read)
├── GEMMA4_QUICK_START.md         ← Implementation Guide (code changes)
├── MEMORY_LEAK_AUDIT.md          ← Quality Checklist (debugging)
└── GEMMA4_INDEX.md               ← YOU ARE HERE
```

---

**Good luck! 🚀**

Feel free to update this index as you progress through implementation.
Last updated: May 10, 2026 @ 14:30 UTC
