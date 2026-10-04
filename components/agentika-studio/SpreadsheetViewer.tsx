import React, { useState, useMemo, useEffect } from 'react';
import { Download, Pin, FileSpreadsheet, Check, Edit2, AlertCircle } from 'lucide-react';
import { FormulaEngine, EvaluatedCell, parseCsvToGrid } from './formulaEngine';
import { exportToSpreadsheet } from '../../utils/agentikaExporter';
import { toast } from '../../utils/toast';

interface SpreadsheetViewerProps {
  csvContent: string;
  title: string;
  onPinToSmartboard?: () => void;
  className?: string;
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  csvContent,
  title,
  onPinToSmartboard,
  className = ''
}) => {
  // Parse raw rows from CSV or formatted text
  const [gridData, setGridData] = useState<string[][]>(() => parseCsvToGrid(csvContent));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; ref: string } | null>({
    row: 1,
    col: 0,
    ref: 'A2'
  });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');

  useEffect(() => {
    setGridData(parseCsvToGrid(csvContent));
  }, [csvContent]);

  // Execute formula engine over the grid
  const evaluatedMatrix: EvaluatedCell[][] = useMemo(() => {
    if (gridData.length === 0) return [];
    try {
      const engine = new FormulaEngine(gridData);
      return engine.evaluateGrid();
    } catch {
      return gridData.map(r => r.map(c => ({
        raw: c,
        value: c,
        isFormula: c.startsWith('='),
        hasError: false
      })));
    }
  }, [gridData]);

  // Active cell info for formula bar
  const activeCellData = useMemo(() => {
    if (!selectedCell || evaluatedMatrix.length === 0) return { raw: '', value: '', formula: '' };
    const { row, col } = selectedCell;
    const cell = evaluatedMatrix[row]?.[col];
    return {
      raw: cell?.raw || '',
      value: cell?.value !== undefined ? String(cell.value) : '',
      formula: cell?.formula || (cell?.raw.startsWith('=') ? cell.raw : '')
    };
  }, [selectedCell, evaluatedMatrix]);

  const getColLetter = (index: number) => String.fromCharCode(65 + index);

  // Handle cell edit save
  const handleSaveCell = (row: number, col: number) => {
    const next = gridData.map(r => [...r]);
    if (next[row]) {
      next[row][col] = cellEditValue;
      setGridData(next);
      toast.success(`Cell ${getColLetter(col)}${row + 1} diperbarui!`);
    }
    setEditingCell(null);
  };

  // Compute summary stats (Rata-rata, Kelulusan)
  const summaryStats = useMemo(() => {
    if (evaluatedMatrix.length < 2) return null;
    let tuntasCount = 0;
    let remedialCount = 0;
    let totalScores = 0;
    let scoreCount = 0;

    for (let r = 1; r < evaluatedMatrix.length; r++) {
      for (let c = 0; c < (evaluatedMatrix[r]?.length || 0); c++) {
        const valStr = String(evaluatedMatrix[r][c]?.value || '').toLowerCase();
        if (valStr === 'tuntas') tuntasCount++;
        if (valStr === 'remedial') remedialCount++;

        const num = Number(evaluatedMatrix[r][c]?.value);
        if (!isNaN(num) && num > 0 && num <= 100 && c >= 3) {
          totalScores += num;
          scoreCount++;
        }
      }
    }

    const totalStudents = tuntasCount + remedialCount || Math.max(1, evaluatedMatrix.length - 1);
    const passRate = totalStudents > 0 ? Math.round((tuntasCount / totalStudents) * 100) : 0;
    const avgScore = scoreCount > 0 ? (totalScores / scoreCount).toFixed(1) : '-';

    return { tuntasCount, remedialCount, passRate, avgScore, totalStudents };
  }, [evaluatedMatrix]);

  if (evaluatedMatrix.length === 0) {
    return <div className="p-4 text-xs text-slate-500 font-mono">Format tabel kosong.</div>;
  }

  const headers = evaluatedMatrix[0] || [];
  const bodyRows = evaluatedMatrix.slice(1);

  return (
    <div className={`spreadsheet-viewer bg-white rounded-2xl border border-slate-300 overflow-hidden font-sans shadow-xs ${className}`}>
      {/* 1. Formula Bar (Like Excel / Google Sheets) */}
      <div className="bg-[#EBE8E2] border-b border-slate-300 p-2.5 flex items-center gap-2 text-xs font-mono">
        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-300 font-black text-[#1D4ED8] w-14 text-center shadow-2xs">
          {selectedCell?.ref || 'A1'}
        </div>
        <div className="text-slate-500 font-bold px-1 select-none">fx</div>
        <input
          type="text"
          value={editingCell ? cellEditValue : (activeCellData.formula || activeCellData.raw)}
          onChange={(e) => {
            if (editingCell) {
              setCellEditValue(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && editingCell) {
              handleSaveCell(editingCell.row, editingCell.col);
            }
          }}
          placeholder="Klik cell untuk memeriksa atau mengedit formula (=AVERAGE, =IF, =SUM)..."
          className="flex-1 bg-white px-3 py-1 rounded-lg border border-slate-300 text-slate-900 font-medium outline-hidden focus:border-[#1D4ED8] shadow-2xs text-xs font-mono"
        />
        {editingCell && (
          <button
            type="button"
            onClick={() => handleSaveCell(editingCell.row, editingCell.col)}
            className="px-2.5 py-1 bg-[#1D4ED8] text-white rounded font-bold text-xs"
          >
            Simpan
          </button>
        )}
      </div>

      {/* 2. Interactive Table Grid with Column Letters & Row Numbers */}
      <div className="overflow-x-auto max-h-[440px] custom-scrollbar bg-white">
        <table className="w-full text-xs text-left border-collapse font-sans select-none">
          <thead className="sticky top-0 bg-[#F5F4F0] text-slate-700 font-extrabold border-b border-slate-300 z-10">
            <tr>
              <th className="w-10 p-2 text-center border-r border-slate-300 bg-slate-200/80 text-[10px] text-slate-500 font-mono">#</th>
              {headers.map((head, cIdx) => (
                <th key={cIdx} className="p-2.5 border-r border-slate-300 last:border-r-0 whitespace-nowrap">
                  <span className="text-[10px] text-slate-400 mr-1.5 font-mono">{getColLetter(cIdx)}</span>
                  {String(head.value || head.raw)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {bodyRows.map((row, rIdx) => {
              const actualRowIndex = rIdx + 1;
              const isSummaryRow = String(row[0]?.value || '').includes('---') || String(row[2]?.value || '').toLowerCase().includes('rata-rata');

              return (
                <tr
                  key={rIdx}
                  className={isSummaryRow ? 'bg-amber-50/70 font-bold border-t-2 border-slate-300' : (rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}
                >
                  <td className="p-2 text-center border-r border-slate-300 bg-slate-100/70 text-[10px] text-slate-500 font-mono">
                    {actualRowIndex + 1}
                  </td>
                  {row.map((cell, cIdx) => {
                    const isSelected = selectedCell?.row === actualRowIndex && selectedCell?.col === cIdx;
                    const isEditing = editingCell?.row === actualRowIndex && editingCell?.col === cIdx;
                    const valStr = String(cell.value || '').toLowerCase();
                    const isRemedial = valStr.includes('remedial');
                    const isTuntas = valStr.includes('tuntas');

                    return (
                      <td
                        key={cIdx}
                        onClick={() => {
                          setSelectedCell({ row: actualRowIndex, col: cIdx, ref: `${getColLetter(cIdx)}${actualRowIndex + 1}` });
                        }}
                        onDoubleClick={() => {
                          setEditingCell({ row: actualRowIndex, col: cIdx });
                          setCellEditValue(cell.raw);
                        }}
                        className={`p-2.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected ? 'ring-2 ring-[#1D4ED8] bg-blue-50/80 font-bold text-[#1D4ED8]' : ''
                        } ${isRemedial ? 'text-rose-700 bg-rose-50/60 font-semibold' : ''} ${isTuntas ? 'text-emerald-700 font-semibold' : ''}`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={cellEditValue}
                            onChange={(e) => setCellEditValue(e.target.value)}
                            onBlur={() => handleSaveCell(actualRowIndex, cIdx)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCell(actualRowIndex, cIdx);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-white px-1 border border-[#1D4ED8] rounded font-mono text-xs outline-hidden"
                          />
                        ) : cell.isFormula ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800">{String(cell.value)}</span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200" title={`Formula asli: ${cell.formula}`}>
                              fx
                            </span>
                          </div>
                        ) : (
                          <span>{String(cell.value)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Summary & Action Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
        {summaryStats && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-600">Ringkasan:</span>
            <span className="bg-white px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-700">
              Rata-rata: <strong>{summaryStats.avgScore}</strong>
            </span>
            <span className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-emerald-800 font-bold">
              Tuntas: {summaryStats.tuntasCount} siswa ({summaryStats.passRate}%)
            </span>
            {summaryStats.remedialCount > 0 && (
              <span className="bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-rose-700 font-bold">
                Remedial: {summaryStats.remedialCount} siswa
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              // Construct CSV text keeping formulas live
              const fullCsv = gridData.map(r => r.join(',')).join('\n');
              exportToSpreadsheet(title, fullCsv);
              toast.success('Mengunduh spreadsheet dengan formula live!');
            }}
            className="flex items-center gap-1 px-3 py-1 bg-[#1D4ED8] hover:bg-[#0a1a3a] text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
          >
            <Download size={13} className="text-[#F5C518]" />
            <span>Unduh .XLSX</span>
          </button>

          {onPinToSmartboard && (
            <button
              type="button"
              onClick={onPinToSmartboard}
              className="flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-full transition-colors cursor-pointer"
            >
              <Pin size={13} />
              <span>Tempel ke Papan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetViewer;
