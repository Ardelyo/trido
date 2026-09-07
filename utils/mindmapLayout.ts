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
 * Intelligent fuzzy matcher for finding mindmap nodes by user or AI label.
 * Handles casing, prefix numbering (1., 1)), punctuation, substring inclusion,
 * and token overlap.
 */
export function findMatchingMindmapNode<T extends { text: string }>(
  targetText: string,
  nodes: T[]
): T | undefined {
  if (!targetText || nodes.length === 0) return undefined;
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/^\d+[\.\)]\s*/, '') // remove "1. ", "1) "
      .replace(/[^\w\s]/g, ' ')     // replace punctuation with space
      .replace(/\s+/g, ' ')
      .trim();

  const searchRaw = targetText.toLowerCase().trim();
  const searchClean = clean(targetText);

  // 1. Exact match (case-insensitive, trimmed)
  const exact = nodes.find(n => n.text.toLowerCase().trim() === searchRaw);
  if (exact) return exact;

  // 2. Cleaned match
  const cleanMatch = nodes.find(n => clean(n.text) === searchClean);
  if (cleanMatch) return cleanMatch;

  // 3. Substring inclusion
  const substring = nodes.find(n => {
    const nc = clean(n.text);
    return (nc.length > 2 && searchClean.includes(nc)) || (searchClean.length > 2 && nc.includes(searchClean));
  });
  if (substring) return substring;

  // 4. Word token overlap (Jaccard similarity)
  const searchWords = new Set(searchClean.split(' ').filter(w => w.length > 2));
  let bestNode: T | undefined = undefined;
  let bestScore = 0;

  for (const n of nodes) {
    const nWords = clean(n.text).split(' ').filter(w => w.length > 2);
    if (nWords.length === 0) continue;
    const matches = nWords.filter(w => searchWords.has(w)).length;
    const score = matches / Math.max(searchWords.size, nWords.length);
    if (score > 0.35 && score > bestScore) {
      bestScore = score;
      bestNode = n;
    }
  }

  return bestNode;
}

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
        const parentNode = findMatchingMindmapNode(p, output);
        if (parentNode) {
          if (!childMap.has(parentNode.text)) childMap.set(parentNode.text, []);
          childMap.get(parentNode.text)!.push(n);
        } else {
          // If parent not found, attach to root
          if (!childMap.has(root.text)) childMap.set(root.text, []);
          childMap.get(root.text)!.push(n);
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

    // Collision resolution & relaxation pass: prevent overlapping bounding boxes
    const RELAXATION_PASSES = 6;
    for (let pass = 0; pass < RELAXATION_PASSES; pass++) {
      for (let i = 0; i < output.length; i++) {
        for (let j = i + 1; j < output.length; j++) {
          const n1 = output[i];
          const n2 = output[j];
          const w1 = NODE_STYLE_CONFIG[n1.style]?.width || 210;
          const h1 = NODE_STYLE_CONFIG[n1.style]?.height || 80;
          const w2 = NODE_STYLE_CONFIG[n2.style]?.width || 210;
          const h2 = NODE_STYLE_CONFIG[n2.style]?.height || 80;

          const minDx = (w1 + w2) / 2 + 35;
          const minDy = (h1 + h2) / 2 + 25;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;

          if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
            const overlapX = minDx - Math.abs(dx);
            const overlapY = minDy - Math.abs(dy);

            if (overlapX < overlapY) {
              const sign = dx >= 0 ? 1 : -1;
              const shift = (overlapX / 2) * sign;
              if (n1 !== root) n1.x -= shift;
              if (n2 !== root) n2.x += shift;
            } else {
              const sign = dy >= 0 ? 1 : -1;
              const shift = (overlapY / 2) * sign;
              if (n1 !== root) n1.y -= shift;
              if (n2 !== root) n2.y += shift;
            }
          }
        }
      }
    }

    return output;

  } catch (error) {
    console.error('Mindmap layout failed or timed out:', error);
    
    // FALLBACK: Simple, clean grid layout centered on target coordinates
    return nodes.map((node, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      return {
        ...node,
        x: centerX + (col - 2) * 240,
        y: centerY + (row - 1) * 180
      };
    });
  }
}

/**
 * Smart dynamic expansion engine for existing mind maps.
 * Places new nodes near their resolved parent without collisions,
 * maintaining the natural cluster/block area of that branch.
 */
export function expandMindmapNodes(
  existingNodes: MindmapLayoutNode[],
  newNodes: MindmapInputNode[],
  fallbackCenter: { x: number; y: number }
): MindmapLayoutNode[] {
  if (newNodes.length === 0) return [];
  if (existingNodes.length === 0) {
    return layoutMindmap(newNodes, fallbackCenter.x, fallbackCenter.y);
  }

  // Find root node of existing mind map
  const root = existingNodes.find(n => !n.parentNodeText) ?? existingNodes[0];
  const rootX = root ? root.x : fallbackCenter.x;
  const rootY = root ? root.y : fallbackCenter.y;

  // Detect whether existing graph is a horizontal tree
  let horizontalCount = 0;
  let totalWithParent = 0;
  existingNodes.forEach(n => {
    if (n.parentNodeText) {
      const p = findMatchingMindmapNode(n.parentNodeText, existingNodes);
      if (p) {
        totalWithParent++;
        if (n.x > p.x + 80 && Math.abs(n.y - p.y) < 500) {
          horizontalCount++;
        }
      }
    }
  });
  const isHorizontalTree = totalWithParent > 0 && horizontalCount / totalWithParent >= 0.6;

  // All nodes (existing + already placed new nodes) for AABB collision testing
  const allNodes: Array<{ x: number; y: number; width: number; height: number; text: string }> = existingNodes.map(n => ({
    x: n.x,
    y: n.y,
    width: NODE_STYLE_CONFIG[n.style]?.width || 210,
    height: NODE_STYLE_CONFIG[n.style]?.height || 80,
    text: n.text
  }));

  const checkCollision = (cx: number, cy: number, w: number, h: number): boolean => {
    return allNodes.some(other => {
      const minDx = (w + other.width) / 2 + 28;
      const minDy = (h + other.height) / 2 + 20;
      return Math.abs(cx - other.x) < minDx && Math.abs(cy - other.y) < minDy;
    });
  };

  const results: MindmapLayoutNode[] = [];

  // Group new nodes by their resolved parent node
  const parentGroups = new Map<MindmapLayoutNode, MindmapInputNode[]>();
  newNodes.forEach(newNode => {
    let parent = newNode.parentNodeText
      ? findMatchingMindmapNode(newNode.parentNodeText, existingNodes)
      : undefined;
    if (!parent) parent = root;

    if (!parentGroups.has(parent)) {
      parentGroups.set(parent, []);
    }
    parentGroups.get(parent)!.push(newNode);
  });

  // Process each group of children under each parent
  parentGroups.forEach((children, parent) => {
    const isParentRoot = parent === root || (Math.abs(parent.x - rootX) < 15 && Math.abs(parent.y - rootY) < 15);
    
    // Existing children of this parent
    const existingChildren = existingNodes.filter(n => {
      if (!n.parentNodeText) return false;
      const p = findMatchingMindmapNode(n.parentNodeText, [parent]);
      return !!p;
    });

    if (isHorizontalTree) {
      // HORIZONTAL TREE PLACEMENT: Place to the right, distributed vertically
      const LEVEL_WIDTH = 290;
      const VERTICAL_GAP = 100;
      const totalCount = existingChildren.length + children.length;
      
      children.forEach((child, idx) => {
        const slotIndex = existingChildren.length + idx;
        const targetX = parent.x + LEVEL_WIDTH;
        let targetY = parent.y + (slotIndex - (totalCount - 1) / 2) * VERTICAL_GAP;

        const w = NODE_STYLE_CONFIG[child.style]?.width || 210;
        const h = NODE_STYLE_CONFIG[child.style]?.height || 80;

        let attempts = 0;
        let step = VERTICAL_GAP;
        while (checkCollision(targetX, targetY, w, h) && attempts < 10) {
          targetY += (attempts % 2 === 0 ? 1 : -1) * step * Math.ceil((attempts + 1) / 2);
          attempts++;
        }

        const placed: MindmapLayoutNode = {
          ...child,
          parentNodeText: parent.text,
          x: Math.round(targetX),
          y: Math.round(targetY)
        };
        results.push(placed);
        allNodes.push({ x: placed.x, y: placed.y, width: w, height: h, text: child.text });
      });

    } else if (isParentRoot) {
      // RADIAL PLACEMENT: PARENT IS ROOT (NEW MAIN BRANCH / SUBTOPIC)
      // Find largest open angular sectors around root
      const existingBranchAngles = existingNodes
        .filter(n => n !== root)
        .map(n => Math.atan2(n.y - rootY, n.x - rootX))
        .sort((a, b) => a - b);

      const targetRadius = 270;
      
      children.forEach((child, idx) => {
        let bestAngle = (idx / children.length) * Math.PI * 2;
        if (existingBranchAngles.length > 0) {
          let maxGap = 0;
          let gapStart = existingBranchAngles[0];
          for (let i = 0; i < existingBranchAngles.length; i++) {
            const nextAngle = i === existingBranchAngles.length - 1
              ? existingBranchAngles[0] + Math.PI * 2
              : existingBranchAngles[i + 1];
            const gap = nextAngle - existingBranchAngles[i];
            if (gap > maxGap) {
              maxGap = gap;
              gapStart = existingBranchAngles[i];
            }
          }
          bestAngle = gapStart + (maxGap * (idx + 1)) / (children.length + 1);
        }

        const w = NODE_STYLE_CONFIG[child.style]?.width || 210;
        const h = NODE_STYLE_CONFIG[child.style]?.height || 80;

        let chosenX = rootX + targetRadius * Math.cos(bestAngle);
        let chosenY = rootY + targetRadius * Math.sin(bestAngle);

        const angleOffsets = [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6, 0.8, -0.8];
        const radiusSteps = [0, 35, 70];

        outerLoop:
        for (const rStep of radiusSteps) {
          for (const aOff of angleOffsets) {
            const testAngle = bestAngle + aOff;
            const testX = rootX + (targetRadius + rStep) * Math.cos(testAngle);
            const testY = rootY + (targetRadius + rStep) * Math.sin(testAngle);
            if (!checkCollision(testX, testY, w, h)) {
              chosenX = testX;
              chosenY = testY;
              existingBranchAngles.push(testAngle);
              existingBranchAngles.sort((a, b) => a - b);
              break outerLoop;
            }
          }
        }

        const placed: MindmapLayoutNode = {
          ...child,
          parentNodeText: parent.text,
          x: Math.round(chosenX),
          y: Math.round(chosenY)
        };
        results.push(placed);
        allNodes.push({ x: placed.x, y: placed.y, width: w, height: h, text: child.text });
      });

    } else {
      // RADIAL PLACEMENT: PARENT IS A BRANCH NODE (SUBTOPIC / DETAIL)
      // The natural branch direction points OUTWARD from Root through Parent
      const branchAngle = Math.atan2(parent.y - rootY, parent.x - rootX);

      const totalChildren = existingChildren.length + children.length;
      const arcSpan = totalChildren === 1
        ? 0
        : Math.min(Math.PI * 0.55, 0.32 * totalChildren);

      children.forEach((child, idx) => {
        const baseRadius = child.style === 'DETAIL' ? 185 : 230;
        const slotIndex = existingChildren.length + idx;
        const nominalAngle = totalChildren === 1
          ? branchAngle
          : (branchAngle - arcSpan / 2 + ((slotIndex + 0.5) / totalChildren) * arcSpan);

        const w = NODE_STYLE_CONFIG[child.style]?.width || 190;
        const h = NODE_STYLE_CONFIG[child.style]?.height || 70;

        let chosenX = parent.x + baseRadius * Math.cos(nominalAngle);
        let chosenY = parent.y + baseRadius * Math.sin(nominalAngle);

        const angleOffsets = [0, 0.16, -0.16, 0.32, -0.32, 0.48, -0.48, 0.64, -0.64];
        const radiusSteps = [0, 30, 60];

        outerLoop:
        for (const rStep of radiusSteps) {
          for (const aOff of angleOffsets) {
            const testAngle = nominalAngle + aOff;
            const testX = parent.x + (baseRadius + rStep) * Math.cos(testAngle);
            const testY = parent.y + (baseRadius + rStep) * Math.sin(testAngle);
            if (!checkCollision(testX, testY, w, h)) {
              chosenX = testX;
              chosenY = testY;
              break outerLoop;
            }
          }
        }

        const placed: MindmapLayoutNode = {
          ...child,
          parentNodeText: parent.text,
          x: Math.round(chosenX),
          y: Math.round(chosenY)
        };
        results.push(placed);
        allNodes.push({ x: placed.x, y: placed.y, width: w, height: h, text: child.text });
      });
    }
  });

  // Post-placement 4-pass AABB relaxation on NEW nodes only (existing nodes remain pinned)
  const RELAX_PASSES = 4;
  for (let pass = 0; pass < RELAX_PASSES; pass++) {
    for (let i = 0; i < results.length; i++) {
      const n1 = results[i];
      const w1 = NODE_STYLE_CONFIG[n1.style]?.width || 210;
      const h1 = NODE_STYLE_CONFIG[n1.style]?.height || 80;

      // Relax against existing pinned nodes
      for (const ex of existingNodes) {
        const w2 = NODE_STYLE_CONFIG[ex.style]?.width || 210;
        const h2 = NODE_STYLE_CONFIG[ex.style]?.height || 80;
        const minDx = (w1 + w2) / 2 + 25;
        const minDy = (h1 + h2) / 2 + 18;
        const dx = n1.x - ex.x;
        const dy = n1.y - ex.y;
        if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
          const overlapX = minDx - Math.abs(dx);
          const overlapY = minDy - Math.abs(dy);
          if (overlapX < overlapY) {
            n1.x += (dx >= 0 ? 1 : -1) * overlapX;
          } else {
            n1.y += (dy >= 0 ? 1 : -1) * overlapY;
          }
        }
      }

      // Relax against other new nodes
      for (let j = i + 1; j < results.length; j++) {
        const n2 = results[j];
        const w2 = NODE_STYLE_CONFIG[n2.style]?.width || 210;
        const h2 = NODE_STYLE_CONFIG[n2.style]?.height || 80;
        const minDx = (w1 + w2) / 2 + 25;
        const minDy = (h1 + h2) / 2 + 18;
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
          const overlapX = minDx - Math.abs(dx);
          const overlapY = minDy - Math.abs(dy);
          if (overlapX < overlapY) {
            const shift = (overlapX / 2) * (dx >= 0 ? 1 : -1);
            n1.x -= shift;
            n2.x += shift;
          } else {
            const shift = (overlapY / 2) * (dy >= 0 ? 1 : -1);
            n1.y -= shift;
            n2.y += shift;
          }
        }
      }
    }
  }

  return results;
}

/**
 * Sequential left-to-right tree layout for mind maps.
 * Guaranteed collision-free vertical distribution.
 */
export function layoutMindmapTreeHorizontal(
  nodes: MindmapInputNode[],
  startX: number,
  startY: number
): MindmapLayoutNode[] {
  if (nodes.length === 0) return [];
  const root = nodes.find(n => !n.parentNodeText) ?? nodes[0];
  const output: MindmapLayoutNode[] = nodes.map(n => ({ ...n, x: startX, y: startY }));

  const childMap = new Map<string, MindmapLayoutNode[]>();
  output.forEach(n => {
    const p = n.parentNodeText;
    if (p) {
      const parent = findMatchingMindmapNode(p, output) || root;
      if (!childMap.has(parent.text)) childMap.set(parent.text, []);
      childMap.get(parent.text)!.push(n);
    }
  });

  let currentY = startY;
  const LEVEL_WIDTH = 320;
  const VERTICAL_GAP = 120;

  function layoutSubtree(node: MindmapLayoutNode, level: number): number {
    const children = childMap.get(node.text) ?? [];
    node.x = startX + level * LEVEL_WIDTH;

    if (children.length === 0) {
      node.y = currentY;
      currentY += VERTICAL_GAP;
      return node.y;
    }

    const childYs: number[] = [];
    children.forEach(c => {
      childYs.push(layoutSubtree(c, level + 1));
    });

    node.y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    return node.y;
  }

  layoutSubtree(root as MindmapLayoutNode, 0);
  return output;
}
