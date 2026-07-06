// Tempel di console browser, atau import sekali di App.tsx untuk expose ke window
import { useStore } from '../store';

export const attachDebugTools = () => {
  (window as any).trido = {
    // Lihat lesson state
    lesson: () => {
      const state = useStore.getState();
      console.table({
        subject: state.lessonPlan?.subject,
        topic: state.lessonPlan?.topic,
        gradeLevel: state.lessonPlan?.gradeLevel,
        phase: state.lessonPlan?.phase,
        completedSteps: state.lessonPlan?.completedSteps?.length || 0
      });
      return state.lessonPlan;
    },

    // Lihat mindmap nodes yang ter-register
    mindmap: () => {
      const nodes = useStore.getState().activeMindmapNodes;
      console.table(nodes.map(n => ({
        text: n.text,
        style: n.style,
        parent: n.parentNodeText || '(root)',
        x: Math.round(n.x),
        y: Math.round(n.y)
      })));
      return nodes;
    },

    // Lihat chat history
    chat: () => {
      const messages = useStore.getState().messages;
      messages.forEach((m, i) => {
        console.log(`${i}. [${m.role}]: ${m.text}`);
      });
      return messages;
    },

    // Lihat action queue
    queue: () => {
      const queue = useStore.getState().actionQueue;
      console.table(queue.map(a => ({ type: a.type, status: a.status })));
      return queue;
    },

    // Reset semua untuk test baru
    reset: () => {
      useStore.getState().clearLesson();
      useStore.getState().clearQueue();
      useStore.setState({ messages: [{ role: 'model', text: 'Halo! Papan baru siap.' }] });
      console.log(' State reset untuk test baru');
    },

    // Full state dump
    dump: () => {
      const s = useStore.getState();
      console.log({
        lesson: s.lessonPlan,
        mindmapNodes: s.activeMindmapNodes.length,
        messages: s.messages.length,
        queueLength: s.actionQueue.length,
        canvasObjectCount: 'check canvasRef.current.getObjects().length manually'
      });
    }
  };
  
  console.log(' Debug tools ready. Use: trido.lesson(), trido.mindmap(), trido.chat(), trido.queue(), trido.reset(), trido.dump()');
};
