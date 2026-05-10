# Memory Leak Audit & Prevention Guide

**Document Status:** Code Review Checklist  
**Purpose:** Identify and prevent memory leaks specific to Smartboard Teach AI  
**Review Frequency:** Before each deployment  

---

## 🔍 Quick Audit Checklist

Run through this list before deploying to production:

### React Hooks (Frontend)

- [ ] **`useEffect` has cleanup return**
  ```typescript
  // ❌ WRONG
  useEffect(() => {
    socket.on('message', handler);
  }, []);
  
  // ✅ CORRECT
  useEffect(() => {
    socket.on('message', handler);
    return () => socket.off('message', handler);
  }, []);
  ```

- [ ] **Timers are cleared**
  ```typescript
  // ❌ WRONG
  useEffect(() => {
    const interval = setInterval(() => fetch('/status'), 5000);
  }, []);
  
  // ✅ CORRECT
  useEffect(() => {
    const interval = setInterval(() => fetch('/status'), 5000);
    return () => clearInterval(interval);
  }, []);
  ```

- [ ] **Array state is bounded**
  ```typescript
  // ❌ WRONG - grows forever
  const [messages, setMessages] = useState([]);
  const addMessage = (m) => setMessages(prev => [...prev, m]);
  
  // ✅ CORRECT - max 100 messages
  const addMessage = (m) => setMessages(prev => {
    const next = [...prev, m];
    return next.length > 100 ? next.slice(-100) : next;
  });
  ```

- [ ] **Refs don't store heavy data**
  ```typescript
  // ❌ WRONG
  const canvasSnapshot = useRef(null);
  useEffect(() => {
    canvasSnapshot.current = canvas.toDataURL(); // ~500KB per snapshot
  }, []);
  
  // ✅ CORRECT
  useEffect(() => {
    const snapshot = canvas.toDataURL();
    // Use snapshot, don't store in ref
  }, []);
  ```

### Server-Side (Node.js)

- [ ] **HTTP/Fetch connections are closed**
  ```typescript
  // ❌ WRONG
  const res = await fetch(url);
  const data = res.json(); // Response body not consumed
  
  // ✅ CORRECT
  const res = await fetch(url);
  const data = await res.json(); // Body fully consumed
  res.body?.cancel?.();
  ```

- [ ] **Timers are cleared on server shutdown**
  ```typescript
  // ❌ WRONG
  setInterval(() => cleanup(), 60000);
  
  // ✅ CORRECT
  const timerId = setInterval(() => cleanup(), 60000);
  process.on('SIGTERM', () => {
    clearInterval(timerId);
    process.exit(0);
  });
  ```

- [ ] **Circular references don't exist**
  ```typescript
  // ❌ WRONG
  const a = { b: null };
  const b = { a: a };
  a.b = b; // Circular!
  
  // ✅ CORRECT - Use weak references or break cycle
  const a = { b: null };
  const b = { aId: a.id }; // Reference by ID only
  ```

### Canvas/DOM

- [ ] **DOM elements are cleaned up**
  ```typescript
  // ❌ WRONG
  const elem = document.createElement('div');
  domElements[id] = elem; // Never deleted
  
  // ✅ CORRECT
  setInterval(() => {
    Object.entries(domElements).forEach(([id, elem]) => {
      if (!canvas.getObjects().find(o => o.id === id)) {
        elem.remove();
        delete domElements[id];
      }
    });
  }, 30000);
  ```

- [ ] **Image cache is bounded**
  ```typescript
  // ❌ WRONG
  const imageCache = new Map();
  imageCache.set(url, await fetch(url)); // Unbounded
  
  // ✅ CORRECT
  class LRUImageCache {
    constructor(maxSize = 50) { this.cache = new Map(); this.maxSize = maxSize; }
    set(key, value) {
      this.cache.delete(key);
      this.cache.set(key, value);
      if (this.cache.size > this.maxSize) {
        const first = this.cache.keys().next().value;
        this.cache.delete(first);
      }
    }
  }
  ```

---

## 📂 File-by-File Audit

### `hooks/useGeminiBrain.ts`

**Potential Leaks:**
- [ ] Canvas screenshot (`canvas.toDataURL()`) properly GC'd after use
- [ ] WebSocket listeners cleaned up on unmount
- [ ] `setTimeout`/`setInterval` in error handlers cleared

**Check:**
```bash
grep -n "useEffect\|setInterval\|setTimeout\|socket.on\|addEventListener" hooks/useGeminiBrain.ts
```

**Expected:** Every `on`/`addEventListener`/`setInterval` should have matching cleanup in dependency return.

---

### `hooks/useAgentProcessor.ts`

**Potential Leaks:**
- [ ] Action queue doesn't grow unbounded
- [ ] Animation frames are cancelled on unmount
- [ ] DOM mutations properly queued and flushed

**Check:**
```bash
grep -n "useState\|setState\|this\." hooks/useAgentProcessor.ts | head -20
```

**Look for:** State arrays without size limits.

---

### `hooks/useSocketSync.ts`

**Potential Leaks:**
- [ ] Socket listeners added/removed symmetrically
- [ ] Room history doesn't accumulate indefinitely
- [ ] Buffer arrays cleared after broadcast

**Check:**
```bash
grep -n "socket\." hooks/useSocketSync.ts
```

**Expected:** For each `socket.on()`, there should be `socket.off()` in cleanup.

---

### `server/ollamaAdapter.ts`

**Potential Leaks:**
- [ ] HTTP response bodies fully consumed
- [ ] Base64 image buffers released after sending
- [ ] Tool call objects not retained across requests

**Check:**
```bash
grep -n "fetch\|JSON\|Buffer\|request\|response" server/ollamaAdapter.ts | head -20
```

**Look for:** Variables that aren't nullified after use.

---

### `store.ts` (Zustand state)

**Potential Leaks:**
- [ ] domElements map is pruned periodically
- [ ] Message history is bounded
- [ ] No circular references between state objects

**Check:**
```bash
grep -n "domElements\|messages\|history" store.ts
```

**Expected:** Each should have max size or TTL.

---

## 🧪 How to Test for Leaks

### Test 1: Long-Running Session

```bash
# 1. Start server with memory monitoring
NODE_OPTIONS=--inspect npm run dev

# 2. Keep DevTools open for 2+ hours
# - Open http://localhost:5173
# - Use the whiteboard normally
# - Make 50+ AI requests

# 3. Check memory growth
# - DevTools → Memory → Take heap snapshot every 30 min
# - Compare snapshots for unreleased objects
```

**Expected:** Heap size should plateau, not grow linearly.

### Test 2: Repeated Action Cycle

```bash
# 1. Run this in browser console (while on app)
for (let i = 0; i < 100; i++) {
  // Simulate user action
  document.querySelector('[data-action="ai-request"]').click();
  await new Promise(r => setTimeout(r, 500));
}

# 2. Monitor heap in DevTools
# Expected: No growth spike, returns to baseline
```

### Test 3: Socket Disconnect/Reconnect

```bash
# 1. Open Smartboard normally
# 2. Disconnect network (DevTools → Network → Offline)
# 3. Try to use AI features (should fail gracefully)
# 4. Reconnect network
# 5. Use features again
# 6. Check DevTools Memory for orphaned listeners

# Expected: No memory accumulation on reconnects
```

### Test 4: Automated Heap Dump

```bash
# Add to server startup
import heapdump from 'heapdump';

// Dump heap every 5 minutes
setInterval(() => {
  heapdump.writeSnapshot(`./heaps/heap-${Date.now()}.heapsnapshot`);
}, 5 * 60 * 1000);

# After test, analyze dumps
# npm install -g heapdump
```

---

## 🛠️ Common Leak Patterns in This Codebase

### Pattern A: Canvas Drawing Not Cleaned

**Where:** `components/CanvasManager.tsx`

```typescript
// ❌ LEAK
const handleDrawShape = (shape) => {
  const fabricObj = new fabric.Rect({...});
  canvas.add(fabricObj);
  // What removes this later? Who tracks garbage?
};

// ✅ FIX
const handleDrawShape = (shape) => {
  const fabricObj = new fabric.Rect({...});
  fabricObj.id = crypto.randomUUID();
  canvas.add(fabricObj);
  
  // Track for later cleanup
  storeState.registerObject(fabricObj.id, fabricObj);
};

// Cleanup (in store effect)
useEffect(() => {
  const cleanup = setInterval(() => {
    const visibleIds = canvas.getObjects().map(o => o.id);
    const allIds = Object.keys(domElements);
    allIds.forEach(id => {
      if (!visibleIds.includes(id) && age(id) > 5min) {
        delete domElements[id];
      }
    });
  }, 30000);
  return () => clearInterval(cleanup);
}, []);
```

### Pattern B: Socket Message Accumulation

**Where:** `hooks/useSocketSync.ts`

```typescript
// ❌ LEAK
const [broadcastHistory, setBroadcastHistory] = useState([]);
socket.on('message', (msg) => {
  setBroadcastHistory(prev => [...prev, msg]); // Grows forever!
});

// ✅ FIX
socket.on('message', (msg) => {
  setBroadcastHistory(prev => {
    const updated = [...prev, msg];
    // Keep only last hour of messages
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return updated.filter(m => m.timestamp > oneHourAgo);
  });
});
```

### Pattern C: Tool HTML Generation

**Where:** `hooks/useGeminiBrain.ts`

```typescript
// ❌ LEAK
html = generateCalculatorHtml();
const elem = document.createElement('div');
elem.innerHTML = html;
domElements[id] = elem; // Stored forever, never freed

// ✅ FIX
html = generateCalculatorHtml();
const elem = document.createElement('div');
elem.innerHTML = html;
elem.createdAt = Date.now();
domElements[id] = elem;

// Later, in cleanup interval:
Object.entries(domElements).forEach(([id, elem]) => {
  const age = Date.now() - elem.createdAt;
  if (age > 30 * 60 * 1000) { // 30 min old
    delete domElements[id];
  }
});
```

---

## 📊 Memory Profiling with Chrome DevTools

### Step 1: Take Initial Snapshot

1. Open Chrome DevTools → Memory tab
2. Click "Take heap snapshot"
3. Save as `baseline.heapsnapshot`

### Step 2: Use App for 10 Minutes

1. Make 20+ AI requests
2. Draw on canvas
3. Open/close dialogs

### Step 3: Take Final Snapshot

1. Click "Take heap snapshot" again
2. Save as `after-10min.heapsnapshot`

### Step 4: Compare

1. Select "Comparison" view
2. Load `after-10min.heapsnapshot`
3. Select "baseline.heapsnapshot" as baseline
4. Look for objects with high "Δ Objects" (increase)

**Expected detainees:**
- Canvas objects (growing = draw leak)
- String arrays (growing = message accumulation)
- DOM nodes (growing = unmounted elements)

---

## 🚨 Red Flags

If you see these in heap snapshots, investigate:

1. **`String[]` with thousands of entries** → Unbounded array
2. **`Function` objects not GC'd** → Closure holding references
3. **`HTMLDivElement` orphans** → Removed from DOM but not freed
4. **`MessagePort` > 1** → Socket listeners duplicated
5. **`Object` named `[anonymous]`** → Circular reference likely

---

## 💡 Quick Fixes Checklist

If leak detected, try these in order:

1. **Restart server** (quick fix) — clears all memory
2. **Reduce array sizes** — Check stores for unbounded arrays
3. **Add interval cleanup** — Prune old objects every 30 min
4. **Profile with Node** — `node --inspect server.ts`, heap dumps
5. **Check Socket.IO** — Ensure listeners cleaned up
6. **Review long-running timers** — Interval cleanup returns

---

## 📝 Recommended Workflow

**Before Each Commit:**
```bash
# 1. Type check
npm run lint

# 2. Manual heap snapshot review (2 min)
# - Open DevTools
# - Take snapshot
# - Search for "domElements" count — should be < 50
# - Search for "messages" length — should be < 100
```

**Before Each Deployment:**
```bash
# 1. Run 30-minute stress test
npm run benchmark  # 10x

# 2. Check heap growth
# - Should be < 20MB growth

# 3. Monitor for errors
# - Check logs for timeouts
# - Check logs for connection drops
```

**Weekly in Production:**
```bash
# 1. Collect heap dumps
# - Automatically with heapdump module
# 2. Compare against baseline
# 3. File issues if growth > 50MB/day
```

---

## 🎓 Educational Resources

- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/memory-101/)
- [React Memory Leaks](https://react.dev/learn/removing-effect-dependencies)
- [Socket.IO Best Practices](https://socket.io/docs/v4/emit-cheatsheet/)

---

## Support

If you find a suspected memory leak:

1. **Document:** When does it happen? (long session, repeated clicks, etc.)
2. **Reproduce:** Can you make it happen consistently?
3. **Profile:** Attach heap snapshot and memory graph
4. **Report:** Include Node.js version, OS, RAM available

Example issue:
> "Memory grows ~50MB/hour during repeated 'Ask AI' clicks. After 8 hours, grows to 3GB. 
> Attached: `baseline.heapsnapshot`, `after-8h.heapsnapshot`
> Environment: Node 18, macOS, 16GB RAM"

---

Good luck debugging! 🔍
