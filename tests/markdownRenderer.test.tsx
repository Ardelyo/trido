import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../components/agentika-studio/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders bold markdown as strong tag without literal asterisks', () => {
    const { container } = render(<MarkdownRenderer content="**Pertanyaan Interaktif:** Apa itu gaya gesek?" />);
    const strongElement = container.querySelector('strong');
    expect(strongElement).toBeTruthy();
    expect(strongElement?.textContent).toBe('Pertanyaan Interaktif:');
    // Ensure literal double asterisks do not appear in text
    expect(container.textContent).not.toContain('**');
  });

  it('renders bullet lists cleanly with list items', () => {
    const markdown = `- Poin 1\n- Poin 2\n- Poin 3`;
    const { container } = render(<MarkdownRenderer content={markdown} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toBe('Poin 1');
  });

  it('renders slide variant with appropriate brand styles', () => {
    const { container } = render(
      <MarkdownRenderer
        content="**Konsep Utama:** Medan Gravitasi"
        variant="slide"
      />
    );
    const strongEl = container.querySelector('strong');
    expect(strongEl?.className).toContain('text-[#1D4ED8]');
  });
});
