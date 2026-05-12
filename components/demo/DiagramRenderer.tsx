import React from 'react';
import { motion } from 'motion/react';

interface Node {
  id: string;
  label: string;
  detail: string;
  position: { x: number; y: number };
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

interface DiagramProps {
  title: string;
  nodes: Node[];
  edges: Edge[];
  themes: string[];
}

export const DiagramRenderer: React.FC<{ data: DiagramProps }> = ({ data }) => {
  const { title, nodes, edges, themes } = data;

  return (
    <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-5xl mx-auto overflow-hidden">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-slate-800 mb-8 text-center tracking-tight"
      >
        {title}
      </motion.h2>

      <div className="relative h-[400px] mb-8 bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <g key={i}>
                <motion.line
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 1 + i * 0.5, duration: 1 }}
                  x1={fromNode.position.x + 80}
                  y1={fromNode.position.y}
                  x2={toNode.position.x - 80}
                  y2={toNode.position.y}
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + i * 0.5 }}
                  x={(fromNode.position.x + toNode.position.x) / 2}
                  y={fromNode.position.y - 15}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-400 uppercase tracking-wider"
                >
                  {edge.label}
                </motion.text>
              </g>
            );
          })}
        </svg>

        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.4, type: 'spring', stiffness: 200 }}
            style={{ 
              left: node.position.x, 
              top: node.position.y,
              transform: 'translate(-50%, -50%)' 
            }}
            className="absolute z-10 w-40 p-4 bg-white rounded-2xl shadow-lg border border-slate-200 group hover:border-blue-400 transition-colors"
          >
            <div className="text-[12px] font-black text-blue-600 mb-1 uppercase tracking-tight">{node.label}</div>
            <div className="text-[11px] font-medium text-slate-500 leading-tight">{node.detail}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center border-t border-slate-100 pt-6">
        {themes.map((theme, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.5 + i * 0.2 }}
            className="px-4 py-2 bg-blue-50 text-blue-700 text-[12px] font-bold rounded-full border border-blue-100"
          >
            #{theme}
          </motion.span>
        ))}
      </div>
    </div>
  );
};
