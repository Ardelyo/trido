import React, { useState, useMemo } from 'react';
import { FunctionSquare, Sliders, RefreshCw, Layers } from 'lucide-react';

interface MathGraphProps {
  config?: {
    title?: string;
    type?: 'QUADRATIC' | 'LINEAR' | 'SIN';
    a?: number;
    b?: number;
    c?: number;
  };
}

export const MathGraphTool: React.FC<MathGraphProps> = ({ config }) => {
  const [funcType, setFuncType] = useState<'QUADRATIC' | 'LINEAR' | 'SIN'>(config?.type || 'QUADRATIC');
  const [a, setA] = useState(config?.a !== undefined ? config.a : 1);
  const [b, setB] = useState(config?.b !== undefined ? config.b : -2);
  const [c, setC] = useState(config?.c !== undefined ? config.c : -3);

  const title = config?.title || 'Grafik Matematika Interaktif';

  // SVG coordinate transform: domain [-8, 8], range [-8, 8]
  const svgWidth = 360;
  const svgHeight = 280;
  const scale = 20; // 20px per unit
  const originX = svgWidth / 2;
  const originY = svgHeight / 2;

  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;

  // Evaluate f(x)
  const evalY = (x: number): number => {
    if (funcType === 'QUADRATIC') return a * x * x + b * x + c;
    if (funcType === 'LINEAR') return a * x + b;
    if (funcType === 'SIN') return a * Math.sin(b * x) + c;
    return 0;
  };

  // Generate SVG path points
  const pathD = useMemo(() => {
    const points: string[] = [];
    const step = 0.15;
    for (let x = -9; x <= 9; x += step) {
      const y = evalY(x);
      const sx = toSvgX(x);
      const sy = toSvgY(y);
      if (sy >= -50 && sy <= svgHeight + 50) {
        points.push(`${points.length === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, [funcType, a, b, c]);

  // Key points (roots & vertex for quadratic)
  const keyPoints = useMemo(() => {
    if (funcType === 'QUADRATIC') {
      const vertexX = -b / (2 * a || 1);
      const vertexY = evalY(vertexX);
      const D = b * b - 4 * a * c;
      const roots: { x: number; y: number; label: string }[] = [];
      if (D >= 0 && a !== 0) {
        const r1 = (-b + Math.sqrt(D)) / (2 * a);
        const r2 = (-b - Math.sqrt(D)) / (2 * a);
        roots.push({ x: r1, y: 0, label: `x₁ = ${r1.toFixed(1)}` });
        if (r1 !== r2) roots.push({ x: r2, y: 0, label: `x₂ = ${r2.toFixed(1)}` });
      }
      return { vertex: { x: vertexX, y: vertexY }, roots };
    }
    return { vertex: null, roots: [] };
  }, [funcType, a, b, c]);

  const equationString = useMemo(() => {
    if (funcType === 'QUADRATIC') {
      return `y = ${a !== 1 ? a : ''}x² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}`;
    }
    if (funcType === 'LINEAR') {
      return `y = ${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}`;
    }
    return `y = ${a} · sin(${b}x) ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}`;
  }, [funcType, a, b, c]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-extrabold text-white text-xs tracking-tight">{title}</span>
        </div>

        {/* Function Type Selector */}
        <div className="flex bg-slate-950 p-1 rounded-lg text-[10px] font-bold">
          <button
            onClick={() => { setFuncType('QUADRATIC'); setA(1); setB(-2); setC(-3); }}
            className={`px-2 py-0.5 rounded transition ${funcType === 'QUADRATIC' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
          >
            Kuadrat
          </button>
          <button
            onClick={() => { setFuncType('LINEAR'); setA(1.5); setB(1); }}
            className={`px-2 py-0.5 rounded transition ${funcType === 'LINEAR' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
          >
            Linear
          </button>
          <button
            onClick={() => { setFuncType('SIN'); setA(2); setB(1); setC(0); }}
            className={`px-2 py-0.5 rounded transition ${funcType === 'SIN' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
          >
            Sinus
          </button>
        </div>
      </div>

      {/* Main Coordinate Plane */}
      <div className="flex-1 relative flex items-center justify-center p-2 bg-[#090d16] overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full max-h-[300px]"
        >
          {/* Grid Lines */}
          {[-8, -6, -4, -2, 2, 4, 6, 8].map(i => (
            <React.Fragment key={i}>
              <line
                x1={toSvgX(i)} y1={0} x2={toSvgX(i)} y2={svgHeight}
                stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3"
              />
              <line
                x1={0} y1={toSvgY(i)} x2={svgWidth} y2={toSvgY(i)}
                stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3"
              />
            </React.Fragment>
          ))}

          {/* Axes */}
          <line x1={0} y1={originY} x2={svgWidth} y2={originY} stroke="#475569" strokeWidth="1.5" />
          <line x1={originX} y1={0} x2={originX} y2={svgHeight} stroke="#475569" strokeWidth="1.5" />

          {/* Function Curve */}
          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />

          {/* Vertex Point */}
          {keyPoints.vertex && (
            <g transform={`translate(${toSvgX(keyPoints.vertex.x)}, ${toSvgY(keyPoints.vertex.y)})`}>
              <circle r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="6" y="-6" fill="#f59e0b" fontSize="9" fontWeight="bold">
                Puncak ({keyPoints.vertex.x.toFixed(1)}, {keyPoints.vertex.y.toFixed(1)})
              </text>
            </g>
          )}

          {/* Root Points */}
          {keyPoints.roots.map((r, i) => (
            <g key={i} transform={`translate(${toSvgX(r.x)}, ${toSvgY(r.y)})`}>
              <circle r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <text x="6" y="12" fill="#10b981" fontSize="9" fontWeight="bold">
                {r.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Equation Badge */}
        <div className="absolute top-2 left-3 px-2.5 py-1 bg-slate-950/80 border border-slate-700/80 rounded-lg text-cyan-300 font-mono text-xs font-bold shadow-md">
          {equationString}
        </div>
      </div>

      {/* Interactive Parameter Sliders */}
      <div className="p-3 bg-slate-800/90 border-t border-slate-700 text-xs flex items-center justify-around gap-4 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">a:</span>
          <input
            type="range" min="-3" max="3" step="0.5" value={a}
            onChange={e => setA(Number(e.target.value))}
            className="w-18 accent-cyan-400"
          />
          <span className="text-white w-5">{a}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">b:</span>
          <input
            type="range" min="-5" max="5" step="0.5" value={b}
            onChange={e => setB(Number(e.target.value))}
            className="w-18 accent-cyan-400"
          />
          <span className="text-white w-5">{b}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">c:</span>
          <input
            type="range" min="-6" max="6" step="1" value={c}
            onChange={e => setC(Number(e.target.value))}
            className="w-18 accent-cyan-400"
          />
          <span className="text-white w-5">{c}</span>
        </div>
      </div>
    </div>
  );
};
