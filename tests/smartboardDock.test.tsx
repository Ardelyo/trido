import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartboardDock } from '../components/smartboard/SmartboardDock';
import { useStore } from '../store';

describe('SmartboardDock', () => {
  beforeEach(() => {
    useStore.setState({ activeTool: 'SELECT' } as any);
  });

  it('renders dock buttons that meet the touch target class', () => {
    const { container } = render(<SmartboardDock />);
    const buttons = container.querySelectorAll('button.touch-target');
    expect(buttons.length).toBeGreaterThanOrEqual(10);
  });

  it('switches the active tool when the pencil is pressed', () => {
    const { container } = render(<SmartboardDock />);
    const buttons = Array.from(container.querySelectorAll('button'));
    // Order is defined by DOCK_ITEMS: select, pencil, ...
    fireEvent.click(buttons[1]);
    expect(useStore.getState().activeTool).toBe('PENCIL');
  });

  it('opens the AI drawer when the mic is pressed', () => {
    vi.useFakeTimers();
    useStore.setState({ isAiDrawerOpen: false } as any);
    render(<SmartboardDock />);
    fireEvent.click(screen.getByTitle('Kontrol Suara AI Smartboard'));
    expect(useStore.getState().isAiDrawerOpen).toBe(true);
    vi.useRealTimers();
  });
});
