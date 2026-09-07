import { describe, it, expect } from 'vitest';
import { tools, validateFunctionCalls, MODEL_CAPABILITIES } from '../server/aiTools';
import { defaultExperimentalConfig } from '../store';

describe('Experimental Mode & Break-The-Limit Capabilities', () => {
  it('has experimental flags in defaultExperimentalConfig', () => {
    expect(defaultExperimentalConfig).toHaveProperty('smartShapesEnabled', true);
    expect(defaultExperimentalConfig).toHaveProperty('attendanceEnabled', true);
    expect(defaultExperimentalConfig).toHaveProperty('breakTheLimitAi', true);
    expect(defaultExperimentalConfig).toHaveProperty('autoTaskAutomation', true);
    expect(defaultExperimentalConfig).toHaveProperty('visualTimerEnabled', true);
    expect(defaultExperimentalConfig).toHaveProperty('markmapEnabled', true);
    expect(defaultExperimentalConfig).toHaveProperty('mermaidEnabled', true);
  });

  it('MODEL_CAPABILITIES unlocks up to 60 tool calls for Gemini 3.8 Flash', () => {
    const cap = MODEL_CAPABILITIES['gemini-3.8-flash'];
    expect(cap.maxToolCallsPerRequest).toBe(60);
    expect(cap.supportsLessonEngine).toBe(true);
  });

  it('validates create_shape for all geometric shapes', () => {
    const shapeTypes = [
      'RECTANGLE', 'CIRCLE', 'TRIANGLE', 'STAR', 'DIAMOND',
      'HEART', 'PENTAGON', 'POLYGON', 'SPEECH_BUBBLE', 'LINE', 'ARROW'
    ];

    const calls = shapeTypes.map((shapeType, i) => ({
      name: 'create_shape',
      args: {
        shapeType,
        x: 100 + i * 20,
        y: 200,
        width: 120,
        height: 100,
        fill: '#3B82F6',
        strokeColor: '#1E40AF',
        strokeWidth: 2,
        text: `Shape ${shapeType}`
      }
    }));

    const result = validateFunctionCalls(calls, []);
    expect(result.isValid).toBe(true);
    expect(result.fixedCalls.length).toBe(11);
  });

  it('validates add_component for ATTENDANCE and TIMER', () => {
    const calls = [
      {
        name: 'add_component',
        args: {
          componentType: 'ATTENDANCE',
          gridPosition: 'TOP_LEFT',
          configJson: JSON.stringify({
            title: 'Presensi Kelas 8A',
            className: 'Kelas 8A - IPA',
            students: [
              { id: 1, name: 'Budi Santoso', status: 'H' },
              { id: 2, name: 'Dewi Lestari', status: 'I' },
              { id: 3, name: 'Fajar Nugraha', status: 'S' }
            ]
          })
        }
      },
      {
        name: 'add_component',
        args: {
          componentType: 'TIMER',
          gridPosition: 'TOP_RIGHT',
          configJson: JSON.stringify({
            mode: 'TIMER',
            seconds: 600,
            isRunning: true,
            isVisualPie: true
          })
        }
      }
    ];

    const result = validateFunctionCalls(calls, []);
    expect(result.isValid).toBe(true);
    expect(result.fixedCalls.length).toBe(2);
  });

  it('validates update_component for editing ATTENDANCE and TIMER', () => {
    const doms = {
      att_1: { id: 'att_1', componentType: 'ATTENDANCE', config: { title: 'Presensi Kelas 8A' } },
      timer_1: { id: 'timer_1', componentType: 'TIMER', config: { title: 'Timer Kelas' } }
    };

    const calls = [
      {
        name: 'update_component',
        args: {
          objectId: 'att_1',
          componentTitle: 'Presensi Kelas 8A',
          action: 'UPDATE_CONFIG',
          configJson: JSON.stringify({
            students: [
              { id: 1, name: 'Budi Santoso', status: 'H' },
              { id: 2, name: 'Dewi Lestari', status: 'H' },
              { id: 3, name: 'Fajar Nugraha', status: 'H' }
            ]
          })
        }
      },
      {
        name: 'update_component',
        args: {
          objectId: 'timer_1',
          componentTitle: 'Timer',
          action: 'UPDATE_CONFIG',
          configJson: JSON.stringify({
            mode: 'TIMER',
            seconds: 180,
            isRunning: true
          })
        }
      }
    ];

    const result = validateFunctionCalls(calls, [], doms);
    expect(result.isValid).toBe(true);
    expect(result.fixedCalls.length).toBe(2);
  });

  it('validates modify_object with CHANGE_COLOR and CHANGE_STROKE', () => {
    const objects = [
      { id: 'shape_rect_1', type: 'RECTANGLE', left: 200, top: 200, fill: '#000000' }
    ];

    const calls = [
      {
        name: 'modify_object',
        args: {
          objectId: 'shape_rect_1',
          action: 'CHANGE_COLOR',
          value: '#10B981'
        }
      },
      {
        name: 'modify_object',
        args: {
          objectId: 'shape_rect_1',
          action: 'CHANGE_STROKE',
          value: '#3B82F6'
        }
      },
      {
        name: 'modify_object',
        args: {
          objectId: 'shape_rect_1',
          action: 'UPDATE_TEXT',
          value: 'Rumus Utama'
        }
      }
    ];

    const result = validateFunctionCalls(calls, objects);
    expect(result.isValid).toBe(true);
    expect(result.fixedCalls.length).toBe(3);
  });
});
