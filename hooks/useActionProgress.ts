import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

/**
 * Progress of the AI's current batch of board actions: { done, total } while it is acting.
 * The queue only shrinks, so the largest length seen during a run is the batch size.
 */
export function useActionProgress() {
  const queueLen = useStore(s => s.actionQueue.length);
  const isActing = useStore(s => s.isActing);
  const peak = useRef(0);
  const [, force] = useState(0);

  useEffect(() => {
    if (!isActing && queueLen === 0) { peak.current = 0; force(n => n + 1); return; }
    if (queueLen + 1 > peak.current) { peak.current = queueLen + 1; force(n => n + 1); }
  }, [queueLen, isActing]);

  const total = peak.current;
  const done = Math.max(0, total - queueLen - (isActing ? 1 : 0));
  return { active: isActing || queueLen > 0, total, done: Math.min(done, total) };
}
