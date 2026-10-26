import { useState, useCallback } from 'react';
import type React from 'react';
import { useStore } from '../store';
import { toast } from '../utils/toast';
import { markdownToMermaidMindmap } from '../components/MermaidTool';
import { parseDocumentFile } from '../utils/documentParser';

/**
 * Drag & drop ingestion for the board: images, markdown/text (→ Mermaid mindmap),
 * PDF/DOCX documents and plain text, placed at the drop position in canvas space.
 */
export function useCanvasDrop(
  fabricRef: React.MutableRefObject<any>,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const updateDomElement = useStore(state => state.updateDomElement);
  const fontFamily = useStore(state => state.fontFamily);
  const fontSize = useStore(state => state.fontSize);
  const brushColor = useStore(state => state.brushColor);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  }, [isDraggingOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (!fabricRef.current || !containerRef.current) return;
    const canvas = fabricRef.current;

    // Convert drop coordinates from screen to canvas world coordinates
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const invVpt = window.fabric.util.invertTransform(canvas.viewportTransform);
    const worldPos = window.fabric.util.transformPoint({ x: screenX, y: screenY }, invVpt);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) {
        const type = file.type.toLowerCase();
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        // 1. Images
        if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            window.fabric.Image.fromURL(dataUrl, (img: any) => {
              const maxDim = 550;
              let scale = 1;
              if (img.width > maxDim || img.height > maxDim) {
                scale = Math.min(maxDim / img.width, maxDim / img.height);
              }
              img.set({
                left: worldPos.x,
                top: worldPos.y,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale,
                id: `img_${Date.now()}`
              });
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.requestRenderAll();
              toast.success(`Gambar "${file.name}" ditambahkan.`);
            });
          };
          reader.readAsDataURL(file);
        }
        // 2. Markdown or Text (Mermaid Mindmap or Notes)
        else if (type.includes('markdown') || type.includes('text') || ['md', 'txt', 'mmd'].includes(ext)) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const rawText = (ev.target?.result as string) || '';
            const isMindmapOrOutline = rawText.includes('#') || rawText.includes('- ') || rawText.includes('mindmap') || rawText.includes('flowchart');
            const code = isMindmapOrOutline
              ? (rawText.trim().startsWith('mindmap') || rawText.trim().startsWith('flowchart')
                  ? rawText.trim()
                  : markdownToMermaidMindmap(rawText, file.name.replace(/\.[^/.]+$/, '')))
              : rawText;

            const id = `mermaid_${Date.now()}`;
            const width = 720;
            const height = 560;
            const rect = new window.fabric.Rect({
              left: worldPos.x, top: worldPos.y, width, height,
              fill: 'rgba(255,255,255,0.01)',
              stroke: '#6366f1', strokeWidth: 1,
              originX: 'center', originY: 'center',
              id, isDomPlaceholder: true
            });
            canvas.add(rect);
            updateDomElement(id, {
              id,
              html: '<div>MERMAID</div>',
              x: worldPos.x,
              y: worldPos.y,
              width,
              height,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              zIndex: 10,
              componentType: 'MERMAID_DIAGRAM',
              config: {
                title: file.name.replace(/\.[^/.]+$/, '') || 'Peta Konsep',
                code
              }
            });
            canvas.setActiveObject(rect);
            canvas.requestRenderAll();
            toast.success(`Peta konsep Mermaid dibuat dari "${file.name}".`);
          };
          reader.readAsText(file);
        }
        // 3. Documents (PDF, DOCX)
        else if (['pdf', 'docx'].includes(ext)) {
          try {
            const doc = await parseDocumentFile(file);
            useStore.getState().setAttachedDocument(doc);
            const id = `doc_${Date.now()}`;
            const width = 640;
            const height = 500;
            const rect = new window.fabric.Rect({
              left: worldPos.x, top: worldPos.y, width, height,
              fill: 'rgba(255,255,255,0.01)',
              stroke: '#3b82f6', strokeWidth: 1,
              originX: 'center', originY: 'center',
              id, isDomPlaceholder: true
            });
            canvas.add(rect);
            updateDomElement(id, {
              id,
              html: '<div>DOCUMENT</div>',
              x: worldPos.x,
              y: worldPos.y,
              width,
              height,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              zIndex: 10,
              componentType: 'DOCUMENT_PAGE',
              config: {
                title: doc.name,
                markdown: `# ${doc.name}\n\n${doc.text.slice(0, 3000)}${doc.text.length > 3000 ? '\n\n*(Teks dipersingkat)*' : ''}`
              }
            });
            canvas.setActiveObject(rect);
            canvas.requestRenderAll();
            toast.success(`Dokumen "${doc.name}" siap di kanvas.`);
          } catch (err) {
            toast.error(`Gagal membaca dokumen: ${(err as any)?.message}`);
          }
        }
      }
      return;
    }

    // Text drag & drop
    const rawText = e.dataTransfer.getData('text/plain');
    if (rawText && rawText.trim()) {
      const isMindmapOrOutline = rawText.includes('#') || rawText.includes('- ') || rawText.includes('mindmap');
      if (isMindmapOrOutline) {
        const id = `mermaid_${Date.now()}`;
        const width = 720;
        const height = 560;
        const code = rawText.trim().startsWith('mindmap')
          ? rawText.trim()
          : markdownToMermaidMindmap(rawText, 'Catatan Peta Konsep');
        const rect = new window.fabric.Rect({
          left: worldPos.x, top: worldPos.y, width, height,
          fill: 'rgba(255,255,255,0.01)',
          stroke: '#6366f1', strokeWidth: 1,
          originX: 'center', originY: 'center',
          id, isDomPlaceholder: true
        });
        canvas.add(rect);
        updateDomElement(id, {
          id,
          html: '<div>MERMAID</div>',
          x: worldPos.x,
          y: worldPos.y,
          width,
          height,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          zIndex: 10,
          componentType: 'MERMAID_DIAGRAM',
          config: { title: 'Peta Konsep', code }
        });
        canvas.setActiveObject(rect);
        canvas.requestRenderAll();
        toast.success('Peta konsep Mermaid dibuat dari teks.');
      } else {
        const textObj = new window.fabric.IText(rawText.trim(), {
          left: worldPos.x,
          top: worldPos.y,
          fontFamily,
          fontSize,
          fill: brushColor,
          id: `text_${Date.now()}`
        });
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.requestRenderAll();
        toast.success('Teks ditambahkan ke kanvas.');
      }
    }
  }, [fontFamily, fontSize, brushColor, updateDomElement]);

  return { isDraggingOver, handleDragOver, handleDragLeave, handleDrop };
}
