import { Parser } from 'hot-formula-parser';

export interface EvaluatedCell {
  raw: string;
  value: string | number;
  formula?: string;
  isFormula: boolean;
  hasError: boolean;
}

export class FormulaEngine {
  private parser: any;
  private rawGrid: string[][];
  private computedGrid: (string | number)[][];

  constructor(rawGrid: string[][]) {
    this.rawGrid = rawGrid;
    this.computedGrid = [];
    this.parser = new Parser();
    this.initHooks();
  }

  private initHooks() {
    this.parser.on('callCellValue', (cellCoord: any, done: (val: any) => void) => {
      const r = cellCoord.row.index;
      const c = cellCoord.column.index;
      const val = this.computedGrid[r]?.[c] ?? this.rawGrid[r]?.[c] ?? 0;
      const num = Number(val);
      done(!isNaN(num) && typeof val !== 'boolean' ? num : val);
    });

    this.parser.on('callRangeValue', (start: any, end: any, done: (vals: any[][]) => void) => {
      const vals: any[][] = [];
      for (let r = start.row.index; r <= end.row.index; r++) {
        const rowVals: any[] = [];
        for (let c = start.column.index; c <= end.column.index; c++) {
          const val = this.computedGrid[r]?.[c] ?? this.rawGrid[r]?.[c] ?? 0;
          const num = Number(val);
          rowVals.push(!isNaN(num) && typeof val !== 'boolean' ? num : val);
        }
        vals.push(rowVals);
      }
      done(vals);
    });
  }

  public evaluateGrid(): EvaluatedCell[][] {
    const result: EvaluatedCell[][] = [];
    this.computedGrid = [];

    // Pre-populate initial non-formula values
    for (let r = 0; r < this.rawGrid.length; r++) {
      this.computedGrid[r] = [];
      const rowResult: EvaluatedCell[] = [];

      for (let c = 0; c < (this.rawGrid[r]?.length || 0); c++) {
        const rawCell = String(this.rawGrid[r][c] || '').trim();
        const isFormula = rawCell.startsWith('=');

        if (!isFormula) {
          const num = Number(rawCell);
          const val = !isNaN(num) && rawCell !== '' ? num : rawCell;
          this.computedGrid[r][c] = val;
          rowResult.push({
            raw: rawCell,
            value: val,
            isFormula: false,
            hasError: false
          });
        } else {
          // Will be evaluated in second pass
          this.computedGrid[r][c] = 0;
          rowResult.push({
            raw: rawCell,
            value: '...',
            formula: rawCell,
            isFormula: true,
            hasError: false
          });
        }
      }
      result.push(rowResult);
    }

    // Second pass: evaluate formulas
    for (let r = 0; r < this.rawGrid.length; r++) {
      for (let c = 0; c < (this.rawGrid[r]?.length || 0); c++) {
        const rawCell = String(this.rawGrid[r][c] || '').trim();
        if (rawCell.startsWith('=')) {
          const formulaExpression = rawCell.slice(1);
          const parsed = this.parser.parse(formulaExpression);

          if (parsed.error) {
            result[r][c].hasError = true;
            result[r][c].value = `#ERROR: ${parsed.error}`;
            this.computedGrid[r][c] = 0;
          } else {
            let finalVal = parsed.result;
            if (typeof finalVal === 'number' && !Number.isInteger(finalVal)) {
              finalVal = Number(finalVal.toFixed(2));
            }
            result[r][c].value = finalVal;
            this.computedGrid[r][c] = finalVal;
          }
        }
      }
    }

    return result;
  }
}

export function parseCsvToGrid(csvText: string): string[][] {
  return csvText
    .split('\n')
    .filter(line => line.trim().length > 0 && !line.startsWith('```'))
    .map(line => {
      // Handles standard commas while respecting basic quotes
      if (line.includes(',')) {
        return line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      }
      return line.split('|').map(cell => cell.trim()).filter(c => c.length > 0);
    });
}
