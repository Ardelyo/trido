# 📚 Trido Documentation Hub

Welcome to the official documentation index for **Trido — AI Smartboard for Inclusive Classroom Education**. All project documentation is organized below by audience and role.

---

## 1. Quick Start, Judging & Release Guides (Root)

| Document | Audience | Description |
|----------|----------|-------------|
| [**`../README.md`**](../README.md) | All | Project overview, Pak Damar's story, architecture diagram, quick start & `.exe` download |
| [**`../JURY_INSTALL_GUIDE.md`**](../JURY_INSTALL_GUIDE.md) | Judges & Evaluators | Step-by-step evaluation guide (`Trido-Setup-1.0.0.exe`, `start.bat`, Ollama & API Key setup) |
| [**`../RELEASE_NOTES.md`**](../RELEASE_NOTES.md) | Users & Judges | Release highlights, distribution formats & desktop app overview |
| [**`../CHANGELOG.md`**](../CHANGELOG.md) | Developers & Reviewers | Chronological release history (`v1.1.0`, `v1.0.0`), security fixes & feature additions |

---

## 2. Educator & Classroom User Guides

| Document | Language | Description |
|----------|----------|-------------|
| [**`TEACHER_GUIDE.md`**](./TEACHER_GUIDE.md) | 🇮🇩 Bahasa Indonesia | Practical classroom guide for teachers (voice commands, lesson flow, interactive tools) |
| [**`USAGE.md`**](./USAGE.md) | 🇬🇧 English | Hands-on guide to voice control, mind maps, 4 quiz types, timers, and student viewer mode |
| [**`TRIDO_COMPREHENSIVE_GUIDE_ID.md`**](./TRIDO_COMPREHENSIVE_GUIDE_ID.md) | 🇮🇩 Bahasa Indonesia | Complete end-to-end manual covering every feature, shortcut, and offline setup |
| [**`TRIDO_COMPREHENSIVE_GUIDE_EN.md`**](./TRIDO_COMPREHENSIVE_GUIDE_EN.md) | 🇬🇧 English | Complete end-to-end manual in English |

---

## 3. Engineering, Architecture, API & Deployment

| Document | Audience | Description |
|----------|----------|-------------|
| [**`API_DOCUMENTATION.md`**](./API_DOCUMENTATION.md) | Engineers & Reviewers | REST API endpoints (`/api/ai/*`), Socket.IO real-time events (`canvas-delta`, `dom-elements-update`), and data schemas |
| [**`DEPLOYMENT.md`**](./DEPLOYMENT.md) | DevOps & Engineers | Local production build, Windows Electron `.exe` packaging, Docker & Vercel deployment |
| [**`../CONTRIBUTING.md`**](../CONTRIBUTING.md) | Contributors & Reviewers | Quality gates (`npm run check`, `npx vitest run`), UI/UX standards, and PR conventions |
| [**`../SECURITY.md`**](../SECURITY.md) | Security Reviewers | SSRF protection, iframe sandboxing, DOMPurify XSS defenses & vulnerability reporting |
| [**`../AGENTS.md`**](../AGENTS.md) | AI Coding Agents | Definitive codebase map and zero-thrashing protocol for autonomous coding agents |

---

## 4. Local AI Research, Fine-Tuning & Benchmarks

| Document | Topic | Description |
|----------|-------|-------------|
| [**`TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md`**](./TRIDO_MODEL_FINE_TUNING_RESEARCH_REPORT.md) | Knowledge Distillation | Teacher-Student SFT/DPO distillation pipeline for `trido-model:latest` & `trido-gemma:2b` |
| [**`RESEARCH_BENCHMARK_REPORT.md`**](./RESEARCH_BENCHMARK_REPORT.md) | Empirical Benchmarks | Latency, tool-call accuracy, and pedagogical comparison benchmarks |
| [**`GEMMA4_INDEX.md`**](./GEMMA4_INDEX.md) | Gemma 4 E2B | Master index for Gemma 4 4-bit quantization and local inference optimization |
| [**`GEMMA4_QUICK_START.md`**](./GEMMA4_QUICK_START.md) | Ollama Setup | Quick-start guide for configuring local Gemma 4 models in Ollama |
| [**`small-model-guide.md`**](./small-model-guide.md) | Prompt Engineering | Capability tiers and prompt optimization for small edge models (2B–9B) |

---

## 5. Competition, WIPO & Business Deliverables

| Document | Event / Purpose | Description |
|----------|-----------------|-------------|
| [**`KAGGLE_WRITEUP.md`**](./KAGGLE_WRITEUP.md) | Google Gemma 4 Good | Official competition writeup (**2nd Place Worldwide**) |
| [**`BUSINESS_MODEL_CANVAS_AND_BENCHMARK.md`**](./BUSINESS_MODEL_CANVAS_AND_BENCHMARK.md) | Sustainability & Impact | Business Model Canvas, cost efficiency, and inclusive education impact |
| [**`NASKAH_PRESENTASI_WIPO_BALI_2026.md`**](./NASKAH_PRESENTASI_WIPO_BALI_2026.md) | WIPO Bali 2026 | Official presentation script for WIPO National Roving Seminar |
| [**`REVIEW_PRESENTASI_WIPO_BALI_2026.md`**](./REVIEW_PRESENTASI_WIPO_BALI_2026.md) | WIPO Bali 2026 | Technical & IP review notes for the WIPO presentation |
| [**`ARCHIVED_ROADMAP_PLAN.md`**](./ARCHIVED_ROADMAP_PLAN.md) | Historical Archive | Early engineering stabilization & lesson engine planning document |
