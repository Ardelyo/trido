import { describe, it, expect } from 'vitest';
import { FormulaEngine, parseCsvToGrid } from '../components/agentika-studio/formulaEngine';

describe('Spreadsheet FormulaEngine', () => {
  it('parses CSV lines into a 2D string grid', () => {
    const csv = `No,Nama,Nilai\n1,Aditya,85\n2,Bima,90`;
    const grid = parseCsvToGrid(csv);
    expect(grid.length).toBe(3);
    expect(grid[0]).toEqual(['No', 'Nama', 'Nilai']);
    expect(grid[1]).toEqual(['1', 'Aditya', '85']);
  });

  it('correctly executes =AVERAGE(D2:F2) formula across cells', () => {
    // Row 1: Headers (0-indexed row 0)
    // Row 2: 1, NISN, Aditya, 80, 90, 100, =AVERAGE(D2:F2) (0-indexed row 1)
    const rawGrid = [
      ['No', 'NISN', 'Nama', 'Tugas1', 'Tugas2', 'NilaiUH', 'NilaiAkhir'],
      ['1', '008', 'Aditya', '80', '90', '100', '=AVERAGE(D2:F2)']
    ];

    const engine = new FormulaEngine(rawGrid);
    const matrix = engine.evaluateGrid();

    // Check evaluated value of cell G2 (row 1, col 6)
    const resultCell = matrix[1][6];
    expect(resultCell.isFormula).toBe(true);
    expect(resultCell.value).toBe(90);
    expect(resultCell.hasError).toBe(false);
  });

  it('correctly executes =IF condition formula for pass/remedial status', () => {
    const rawGrid = [
      ['No', 'Nama', 'Nilai', 'Status'],
      ['1', 'Siswa Lulus', '80', '=IF(C2>=75, "Tuntas", "Remedial")'],
      ['2', 'Siswa Remedial', '65', '=IF(C3>=75, "Tuntas", "Remedial")']
    ];

    const engine = new FormulaEngine(rawGrid);
    const matrix = engine.evaluateGrid();

    expect(matrix[1][3].value).toBe('Tuntas');
    expect(matrix[2][3].value).toBe('Remedial');
  });

  it('handles multiple formula dependencies and summaries', () => {
    const rawGrid = [
      ['No', 'Nama', 'Nilai1', 'Nilai2', 'RataRata', 'Hasil'],
      ['1', 'Aditya', '85', '95', '=AVERAGE(C2:D2)', '=IF(E2>=75, "Tuntas", "Remedial")']
    ];

    const engine = new FormulaEngine(rawGrid);
    const matrix = engine.evaluateGrid();

    expect(matrix[1][4].value).toBe(90);
    expect(matrix[1][5].value).toBe('Tuntas');
  });
});
