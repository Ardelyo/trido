/**
 * Client-side radial tree layout engine for mind maps.
 *
 * Principle: The LLM provides semantic content (node text, style, parent).
 * This engine computes all 2D positions — the LLM never needs to think spatially.
 *
 * Algorithm: Weighted radial layout using subtree-size proportional arc allocation.
 * Each node's children are spread in an arc proportional to their subtree weight,
 * ensuring larger branches get more angular space (no overlap).
 */

export interface MindmapInputNode {
  text: string;
  style: 'MAIN_TOPIC' | 'SUBTOPIC' | 'DETAIL' | 'HIGHLIGHT';
  parentNodeText?: string | null;
}

export interface MindmapLayoutNode extends MindmapInputNode {
  x: number;
  y: number;
}

// Visual dimensions by style
export const NODE_STYLE_CONFIG: Record<string, { fill: string; width: number; height: number }> = {
  MAIN_TOPIC: { fill: '#4F46E5', width: 260, height: 100 },
  SUBTOPIC:   { fill: '#0EA5E9', width: 210, height: 80  },
  DETAIL:     { fill: '#475569', width: 170, height: 60  },
  HIGHLIGHT:  { fill: '#F59E0B', width: 210, height: 80  },
};

/**
 * Lay out a list of mind-map nodes using weighted radial tree placement.
 * Mutates each node's x/y fields and returns the same array.
 */
export function layoutMindmap(
  nodes: MindmapInputNode[],
  centerX: number,
  centerY: number
): MindmapLayoutNode[] {
  if (nodes.length === 0) return [];

  const startTime = performance.now();
  const TIMEOUT_MS = 3000; // 3 seconds max

  const checkTimeout = () => {
    if (performance.now() - startTime > TIMEOUT_MS) {
      throw new Error('Layout calculation timeout (complex graph)');
    }
  };

  try {
    const output: MindmapLayoutNode[] = nodes.map(n => ({ ...n, x: centerX, y: centerY }));

    // Find root — MAIN_TOPIC or first node with no parent
    const root = output.find(n => !n.parentNodeText) ?? output[0];

    // Build parent → children map (keyed by text)
    const childMap = new Map<string, MindmapLayoutNode[]>();
    output.forEach(n => {
      checkTimeout();
      const p = n.parentNodeText;
      if (p && p !== root.text) {
        // Normalise: find the actual node whose text matches p (fuzzy fallback)
        const parentNode = output.find(o => o.text === p)
          ?? output.find(o => o.text.toLowerCase().includes(p.toLowerCase()))
          ?? output.find(o => p.toLowerCase().includes(o.text.toLowerCase()));
        if (parentNode) {
          if (!childMap.has(parentNode.text)) childMap.set(parentNode.text, []);
          childMap.get(parentNode.text)!.push(n);
        }
      } else if (p === root.text || (!n.parentNodeText && n !== root)) {
        // Direct root children
        if (!childMap.has(root.text)) childMap.set(root.text, []);
        childMap.get(root.text)!.push(n);
      }
    });

    // Count weighted subtree size (leaf = 1, branch = sum of children)
    const sizeCache = new Map<string, number>();
    function subtreeSize(text: string): number {
      checkTimeout();
      if (sizeCache.has(text)) return sizeCache.get(text)!;
      const children = childMap.get(text) ?? [];
      const size = children.length === 0 ? 1 : children.reduce((s, c) => s + subtreeSize(c.text), 0);
      sizeCache.set(text, size);
      return size;
    }

    // Radial distances by depth
    const DEPTH_RADIUS: Record<number, number> = {
      0: 0,
      1: 270,
      2: 460,
      3: 620,
    };
    const getRadius = (depth: number) => DEPTH_RADIUS[depth] ?? 620 + (depth - 3) * 160;

    // Recursively place nodes
    function place(
      node: MindmapLayoutNode,
      parentX: number,
      parentY: number,
      startAngle: number,
      endAngle: number,
      depth: number
    ) {
      checkTimeout();
      // Position this node
      if (depth === 0) {
        node.x = centerX;
        node.y = centerY;
      } else {
        const radius = getRadius(depth);
        const midAngle = (startAngle + endAngle) / 2;
        node.x = centerX + radius * Math.cos(midAngle);
        node.y = centerY + radius * Math.sin(midAngle);
      }

      // Position children
      const children = childMap.get(node.text) ?? [];
      if (children.length === 0) return;

      const arcSpan = depth === 0
        ? Math.PI * 2           // root: full circle
        : (endAngle - startAngle) * 0.85; // child: narrower arc
      const arcCenter = depth === 0 ? 0 : (startAngle + endAngle) / 2;
      const arcStart = arcCenter - arcSpan / 2;

      const totalWeight = children.reduce((s, c) => s + subtreeSize(c.text), 0);
      let currentAngle = arcStart;

      children.forEach(child => {
        const weight = subtreeSize(child.text);
        const childArc = arcSpan * (weight / totalWeight);
        const childStart = currentAngle;
        const childEnd = currentAngle + childArc;
        place(child, node.x, node.y, childStart, childEnd, depth + 1);
        currentAngle = childEnd;
      });
    }

    place(root, centerX, centerY, -Math.PI, Math.PI, 0);
    return output;

  } catch (error) {
    console.error('Mindmap layout failed or timed out:', error);
    
    // FALLBACK: Simple, clean grid layout centered on target coordinates
    return nodes.map((node, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      return {
        ...node,
        x: centerX + (col - 2) * 220,
        y: centerY + (row - 1) * 160
      };
    });
  }
}
