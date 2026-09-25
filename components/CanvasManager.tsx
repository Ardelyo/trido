
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getStroke } from 'perfect-freehand';
import { useStore } from '../store';
import { useAgentProcessor } from '../hooks/useAgentProcessor';
import { AgentCursor } from './AgentCursor';
import { DomOverlay } from './DomOverlay';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../utils/toast';
import { parseDocumentFile } from '../utils/documentParser';
import { markdownToMermaidMindmap } from './MermaidTool';
import { UploadCloud, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

interface CanvasManagerProps {
  onCanvasReady: (canvas: any) => void;
}

export const CanvasManager: React.FC<CanvasManagerProps> = ({ onCanvasReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const addLog = useStore(state => state.addLog);
  const setViewport = useStore(state => state.setViewport);
  const setCursorPosition = useStore(state => state.setCursorPosition);
  const updateDomElement = useStore(state => state.updateDomElement);
  const removeDomElement = useStore(state => state.removeDomElement);
  
  const activeTool = useStore(state => state.activeTool);
  const isShapeFilled = useStore(state => state.isShapeFilled);
  const brushColor = useStore(state => state.brushColor);
  const brushWidth = useStore(state => state.brushWidth);
  const fontFamily = useStore(state => state.fontFamily);
  const fontSize = useStore(state => state.fontSize);
  const setActiveTool = useStore(state => state.setActiveTool);
  const currentPageIndex = useStore(state => state.currentPageIndex);
  const currentSessionId = useStore(state => state.currentSessionId);
  const isViewerUrl = useStore(state => state.isViewerUrl);
  const prevPageIndex = useRef(currentPageIndex);
  const prevSessionId = useRef(currentSessionId);

  // Handle Page and Session Switching
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    
    if (prevPageIndex.current !== currentPageIndex || prevSessionId.current !== currentSessionId) {
      // If session is the same, we save the previous page state
      if (prevSessionId.current === currentSessionId && prevPageIndex.current !== currentPageIndex) {
        const prevState = canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']);
        const prevDom = useStore.getState().domElements;
        const prevMindmap = useStore.getState().activeMindmapNodes;
        try {
          const previewUrl = canvas.toDataURL({ format: 'png', multiplier: 0.2 });
          useStore.getState().updatePageData(prevPageIndex.current, prevState, prevDom, previewUrl, prevMindmap);
        } catch (e) {
          useStore.getState().updatePageData(prevPageIndex.current, prevState, prevDom, undefined, prevMindmap);
        }
      }
      
      // Load new state
      const newPageData = useStore.getState().pages[currentPageIndex] || { canvas: {}, dom: {} };
      
      // Temporarily disable history to avoid messing up undo stack
      canvas.clear(); 
      canvas.__loadingPage = true;
      
      // Load DOM Elements
      useStore.getState().setDomElements(newPageData.dom || {});
      
      if (!newPageData.canvas || Object.keys(newPageData.canvas).length === 0) {
        canvas.clear();
        canvas.backgroundColor = 'transparent';
        canvas.requestRenderAll();
        canvas.__loadingPage = false;
      } else {
        canvas.loadFromJSON(newPageData.canvas, () => {
          canvas.renderAll();
          canvas.__loadingPage = false;
        });
      }
      
      // We might want to clear undo history when switching pages (Simplest UX)
      if (canvas.__clearHistory) canvas.__clearHistory();
      
      prevPageIndex.current = currentPageIndex;
      prevSessionId.current = currentSessionId;
    }
  }, [currentPageIndex, currentSessionId]);

  useEffect(() => {
    if (!canvasRef.current || !window.fabric) return;

    // --- CUSTOM CONTROLS (DELETE BUTTON ON SELECTION) ---
    const deleteIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 6 18'/%3E%3Cpath d='m6 6 12 12'/%3E%3C/svg%3E";
    const img = document.createElement('img');
    img.src = deleteIcon;

    function renderIcon(ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) {
      const size = 20;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(window.fabric.util.degreesToRadians(fabricObject.angle));
      
      // Draw background circle
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4b4b';
      ctx.fill();
      
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    function deleteObject(eventData: any, transform: any) {
      const target = transform.target;
      const canvas = target.canvas;
      if (target.type === 'activeSelection') {
        target.forEachObject((obj: any) => {
          canvas.remove(obj);
          if (obj.isDomPlaceholder) removeDomElement(obj.id);
        });
        canvas.discardActiveObject();
      } else {
        canvas.remove(target);
        if (target.isDomPlaceholder) removeDomElement(target.id);
      }
      canvas.requestRenderAll();
      return true;
    }

    window.fabric.Object.prototype.controls.deleteControl = new window.fabric.Control({
      x: 0.5,
      y: -0.5,
      offsetY: -12,
      offsetX: 12,
      cursorStyle: 'pointer',
      mouseUpHandler: deleteObject,
      render: renderIcon,
      // @ts-ignore
      cornerSize: 28
    });

    const canvas = new window.fabric.Canvas(canvasRef.current, {
      backgroundColor: 'transparent',
      selection: true,
      allowTouchScrolling: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      imageSmoothingEnabled: true,
      enableRetinaScaling: true,
      fireRightClick: true,
      stopContextMenu: true,
    });

    // Selection styling
    window.fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#000000',
      borderColor: '#ffffff',
      cornerSize: 8,
      padding: 10,
      cornerStyle: 'circle',
      borderDashArray: [4, 4]
    });

    fabricRef.current = canvas;
    const resizeCanvas = () => {
      if (!canvas || !canvas.lowerCanvasEl || !containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      canvas.setWidth(clientWidth);
      canvas.setHeight(clientHeight);
      canvas.requestRenderAll();
      setViewport(canvas.getZoom(), [...(canvas.viewportTransform || [1, 0, 0, 1, 0, 0])]);
    };
    
    let rafId = requestAnimationFrame(() => {
       resizeCanvas();
       if (containerRef.current) {
          setCursorPosition({ x: containerRef.current.clientWidth / 2, y: containerRef.current.clientHeight / 2 });
       }
    });

    let resizeTimeout: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 50);
    });
    
    if (containerRef.current) {
       resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    // --- NAVIGATION LOGIC (PAN & ZOOM) ---
    let isPanning = false;
    let isSpaceDown = false;
    let lastPosX: number;
    let lastPosY: number;
    

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
      if (isViewerUrl) return;

      if (e.code === 'Space') {
        isSpaceDown = true;
        canvas.defaultCursor = 'grab';
        canvas.selection = false;
        canvas.requestRenderAll();
      }

      // Zoom Keyboard Shortcuts
      if (e.key === '=' || e.key === '+') {
        const zoom = Math.min(canvas.getZoom() * 1.1, 20);
        canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, zoom);
        setViewport(canvas.getZoom(), [...canvas.viewportTransform]);
      }
      if (e.key === '-' || e.key === '_') {
        const zoom = Math.max(canvas.getZoom() / 1.1, 0.01);
        canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, zoom);
        setViewport(canvas.getZoom(), [...canvas.viewportTransform]);
      }
      if (e.key === '0') {
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.setZoom(1);
        setViewport(1, [1, 0, 0, 1, 0, 0]);
      }

      // Deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.isEditing) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach((obj: any) => {
            canvas.remove(obj);
            if (obj.isDomPlaceholder) removeDomElement(obj.id);
          });
          canvas.discardActiveObject().requestRenderAll();
          addLog(`Menghapus ${activeObjects.length} objek.`);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDown = false;
        canvas.defaultCursor = 'default';
        if (useStore.getState().activeTool === 'SELECT') canvas.selection = true;
        canvas.requestRenderAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    canvas.on('mouse:down', function(opt: any) {
      if (isViewerUrl) return;
      const evt = opt.e;
      const isTouch = evt.touches && evt.touches.length === 1;
      const isRightClick = evt.button === 2;
      const isMiddleClick = evt.button === 1;
      
      // Pan triggers: Space+Drag, Right-click, Middle-click, or Touch-on-empty
      if (isSpaceDown || isRightClick || isMiddleClick || (isTouch && !opt.target)) {
        isPanning = true;
        canvas.selection = false;
        canvas.defaultCursor = 'grabbing';
        lastPosX = evt.clientX || (evt.touches && evt.touches[0].clientX);
        lastPosY = evt.clientY || (evt.touches && evt.touches[0].clientY);
        canvas.requestRenderAll();
        return;
      }
    });

    canvas.on('mouse:move', function(opt: any) {
      if (isPanning) {
        const e = opt.e;
        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const currentY = e.clientY || (e.touches && e.touches[0].clientY);
        if (currentX === undefined || currentY === undefined) return;
        const vpt = canvas.viewportTransform;
        vpt[4] += currentX - lastPosX;
        vpt[5] += currentY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = currentX;
        lastPosY = currentY;
        setViewport(canvas.getZoom(), [...vpt]);
      }
    });

    canvas.on('mouse:up', function(opt: any) {
      if (isPanning) {
        canvas.setViewportTransform(canvas.viewportTransform);
        isPanning = false;
        canvas.defaultCursor = isSpaceDown ? 'grab' : 'default';
        if (!isSpaceDown && useStore.getState().activeTool === 'SELECT') canvas.selection = true;
        canvas.requestRenderAll();
      }
    });

    canvas.on('mouse:wheel', function(opt: any) {
      if (isViewerUrl) {
         opt.e.preventDefault();
         opt.e.stopPropagation();
         return;
      }
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      setViewport(canvas.getZoom(), [...canvas.viewportTransform]);
    });

    canvas.on('touch:gesture', function(opt: any) {
      if (opt.e.touches && opt.e.touches.length === 2) {
         if (opt.self.state === "start") canvas.startZoom = canvas.getZoom();
         if (opt.self.state === "change") {
             let zoom = canvas.startZoom * opt.self.scale;
             zoom = Math.min(Math.max(zoom, 0.01), 20);
             const point = new window.fabric.Point(opt.self.x, opt.self.y);
             canvas.zoomToPoint(point, zoom);
             setViewport(canvas.getZoom(), canvas.viewportTransform);
         }
      }
    });

    const handleRemoteRemove = (e: any) => {
      const id = e.detail?.id;
      if (!id) return;
      const obj = canvas.getObjects().find((o: any) => o.id === id);
      if (obj) {
        canvas.remove(obj);
        removeDomElement(id);
        canvas.requestRenderAll();
      }
    };
    window.addEventListener('removeCanvasObject', handleRemoteRemove);

    const handleClearCanvas = () => {
      canvas.clear();
      canvas.backgroundColor = 'transparent';
      canvas.requestRenderAll();
    };
    window.addEventListener('clearCanvas', handleClearCanvas);

    const handleMovePlaceholder = (e: any) => {
      const { id, x, y } = e.detail || {};
      if (!id) return;
      const obj = canvas.getObjects().find((o: any) => o.id === id);
      if (obj) {
        obj.set({ left: x, top: y });
        canvas.requestRenderAll();
      }
    };
    window.addEventListener('moveCanvasPlaceholder', handleMovePlaceholder);

    const updateDomFromObject = (obj: any) => {
       if (obj.isDomPlaceholder) {
         updateDomElement(obj.id, {
           x: obj.left,
           y: obj.top,
           scaleX: obj.scaleX,
           scaleY: obj.scaleY,
           rotation: obj.angle,
         });
       }
    };

    canvas.on('object:moving', (e: any) => {
      const obj = e.target;
      if (!obj) return;
      if (obj.type === 'activeSelection') obj.getObjects().forEach((o: any) => updateDomFromObject(o));
      else updateDomFromObject(obj);
    });

    canvas.on('object:scaling', (e: any) => {
      const obj = e.target;
      if (!obj) return;
      
      const handleScaling = (o: any) => {
        if (o.isDomPlaceholder) {
          const newWidth = o.width * o.scaleX;
          const newHeight = o.height * o.scaleY;
          o.set({
            width: newWidth,
            height: newHeight,
            scaleX: 1,
            scaleY: 1
          });
          updateDomElement(o.id, {
            width: newWidth,
            height: newHeight,
            x: o.left,
            y: o.top,
            scaleX: 1,
            scaleY: 1,
            rotation: o.angle
          });
        } else {
          updateDomFromObject(o);
        }
      };

      if (obj.type === 'activeSelection') obj.getObjects().forEach((o: any) => handleScaling(o));
      else handleScaling(obj);
    });

    canvas.on('object:rotating', (e: any) => {
      const obj = e.target;
      if (!obj) return;
      if (obj.type === 'activeSelection') obj.getObjects().forEach((o: any) => updateDomFromObject(o));
      else updateDomFromObject(obj);
    });

    canvas.on('object:removed', (e: any) => {
      const obj = e.target;
      if (obj && obj.isDomPlaceholder) removeDomElement(obj.id);
    });
    
    canvas.on('path:created', (e: any) => {
      const path = e.path;
      path.set({ id: `draw_${Date.now()}`, zIndex: 1 });

      const exp = useStore.getState().experimentalConfig;
      if (exp?.enabled && exp?.smoothInkingEnabled && path.path && path.path.length >= 4) {
        try {
          const points: [number, number][] = [];
          path.path.forEach((cmd: any) => {
            if (cmd[0] === 'M' || cmd[0] === 'L') {
              points.push([cmd[1], cmd[2]]);
            } else if (cmd[0] === 'Q') {
              points.push([cmd[1], cmd[2]]);
              points.push([cmd[3], cmd[4]]);
            }
          });

          if (points.length >= 3) {
            const strokeOutline = getStroke(points, {
              size: path.strokeWidth || 4,
              thinning: 0.5,
              smoothing: 0.7,
              streamline: 0.6
            });
            if (strokeOutline && strokeOutline.length) {
              const d = strokeOutline.reduce(
                (acc: any[], [x0, y0]: number[], i: number, arr: any[]) => {
                  const [x1, y1] = arr[(i + 1) % arr.length];
                  acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
                  return acc;
                },
                ['M', ...strokeOutline[0], 'Q']
              );
              d.push('Z');
              const svgD = d.join(' ');
              if (svgD) {
                const smoothPath = new window.fabric.Path(svgD, {
                  fill: path.stroke || '#1e293b',
                  stroke: 'transparent',
                  id: path.id,
                  zIndex: 1,
                  selectable: true,
                  evented: true
                });
                canvas.remove(path);
                canvas.add(smoothPath);
                canvas.requestRenderAll();
              }
            }
          }
        } catch (err) {
          console.warn('Smooth inking fallback:', err);
        }
      }
    });

    // --- HISTORY LOGIC ---
    let history: string[] = [];
    let redoStack: string[] = [];
    let isHistoryUpdating = false;

    canvas.__clearHistory = () => {
       history = [];
       redoStack = [];
       setTimeout(saveHistory, 100);
    };

    let savePreviewTimeout: any;

    const saveHistory = () => {
      if (isHistoryUpdating || canvas.__loadingPage) return;
      const json = JSON.stringify(canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']));
      if (history.length === 0 || history[history.length - 1] !== json) {
        history.push(json);
        if (history.length > 50) history.shift();
        redoStack = [];
      }
      // Also update the store page data on every action
      useStore.getState().updatePageData(
        useStore.getState().currentPageIndex, 
        canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']), 
        useStore.getState().domElements
      );
      
      // Debounce preview generation
      clearTimeout(savePreviewTimeout);
      savePreviewTimeout = setTimeout(() => {
        try {
          const previewUrl = canvas.toDataURL({ format: 'png', multiplier: 0.2 });
          useStore.getState().updatePageData(
            useStore.getState().currentPageIndex,
            canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']),
            useStore.getState().domElements,
            previewUrl
          );
        } catch (e) {
          // Ignore
        }
      }, 1000);
    };

    canvas.on('object:added', () => saveHistory());
    canvas.on('object:modified', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());
    
    // Initial state save
    setTimeout(saveHistory, 100);

    const undoCanvas = () => {
      if (history.length > 1) {
        isHistoryUpdating = true;
        redoStack.push(history.pop()!); // Current state goes to redo
        const prevState = history[history.length - 1]; // We don't pop the prev state, it remains active
        canvas.loadFromJSON(prevState, () => {
          canvas.renderAll();
          isHistoryUpdating = false;
        });
      }
    };

    const redoCanvas = () => {
      if (redoStack.length > 0) {
        isHistoryUpdating = true;
        const nextState = redoStack.pop()!;
        history.push(nextState);
        canvas.loadFromJSON(nextState, () => {
          canvas.renderAll();
          isHistoryUpdating = false;
        });
      }
    };

    useStore.getState().setUndoRedoFunctions(undoCanvas, redoCanvas);

    // Set initial center coordinates
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    // Expose snapshot function on window for clean persistence
    const snapshotCurrentCanvas = () => {
      if (!canvas) return;
      const prevState = canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']);
      const prevDom = useStore.getState().domElements;
      const prevMindmap = useStore.getState().activeMindmapNodes;
      try {
        const previewUrl = canvas.toDataURL({ format: 'png', multiplier: 0.2 });
        useStore.getState().updatePageData(useStore.getState().currentPageIndex, prevState, prevDom, previewUrl, prevMindmap);
      } catch (e) {
        useStore.getState().updatePageData(useStore.getState().currentPageIndex, prevState, prevDom, undefined, prevMindmap);
      }
    };

    (window as any).__snapshotCanvas = snapshotCurrentCanvas;

    // Debounced continuous auto-save whenever canvas content changes
    let autoSaveTimer: any = null;
    const triggerDebouncedSnapshot = () => {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        snapshotCurrentCanvas();
      }, 1200);
    };

    canvas.on('object:modified', triggerDebouncedSnapshot);
    canvas.on('object:added', triggerDebouncedSnapshot);
    canvas.on('object:removed', triggerDebouncedSnapshot);

    onCanvasReady(fabricRef);
    addLog('Pemetaan kanvas aktif.');

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
      clearTimeout(autoSaveTimer);
      delete (window as any).__snapshotCanvas;
      canvas.off('object:modified', triggerDebouncedSnapshot);
      canvas.off('object:added', triggerDebouncedSnapshot);
      canvas.off('object:removed', triggerDebouncedSnapshot);
      canvas.dispose();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('removeCanvasObject', handleRemoteRemove);
      window.removeEventListener('clearCanvas', handleClearCanvas);
      window.removeEventListener('moveCanvasPlaceholder', handleMovePlaceholder);
    };
  }, []);

  useAgentProcessor(fabricRef);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    
    canvas.freeDrawingBrush = new window.fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;
    canvas.freeDrawingBrush.decimate = 2.0; // ⚡ Real-time point simplification (Douglas-Peucker approximation)

    if (isViewerUrl) {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'default';
      canvas.getObjects().forEach(o => { o.selectable = false; o.evented = false; });
      canvas.requestRenderAll();
      return;
    }

    if (activeTool === 'ERASER') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.defaultCursor = 'cell';
      canvas.freeDrawingBrush = new window.fabric.PencilBrush(canvas);
      // Eraser uses white/background color at large width
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = Math.max(brushWidth * 4, 20);
      canvas.freeDrawingBrush.decimate = 2.0; // ⚡ Real-time point simplification for eraser
      canvas.discardActiveObject();
      canvas.getObjects().forEach((o: any) => { o.selectable = false; o.evented = false; });
      canvas.requestRenderAll();
    } else if (activeTool === 'PENCIL') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.discardActiveObject();
      canvas.getObjects().forEach(o => { o.selectable = false; o.evented = false; });
      canvas.requestRenderAll();
    } else {
      canvas.isDrawingMode = false;
      canvas.selection = (activeTool === 'SELECT');
      canvas.defaultCursor = 'default';
      canvas.getObjects().forEach(o => { o.selectable = true; o.evented = true; });
    }

    if (activeTool === 'TEXT') {
       const center = canvas.getVpCenter();
       const text = new window.fabric.IText('Tulis...', {
         left: center.x, top: center.y,
         fontFamily: fontFamily,
         fill: brushColor,
         fontSize: fontSize,
         fontWeight: 500,
         originX: 'center', originY: 'center',
         id: `text_${Date.now()}`
       });
       canvas.add(text);
       canvas.setActiveObject(text);
       text.enterEditing();
       text.selectAll();
       canvas.requestRenderAll();
       setActiveTool('SELECT');
    } else if (activeTool === 'RECTANGLE') {
       const center = canvas.getVpCenter();
       const rect = new window.fabric.Rect({
         left: center.x, top: center.y,
         width: 100, height: 100,
         fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor,
         strokeWidth: brushWidth,
         rx: 8, ry: 8,
         shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center',
         id: `rect_${Date.now()}`
       });
       canvas.add(rect);
       canvas.setActiveObject(rect);
       canvas.requestRenderAll();
       setActiveTool('SELECT');
    } else if (activeTool === 'CIRCLE') {
       const center = canvas.getVpCenter();
       const circle = new window.fabric.Circle({
         left: center.x, top: center.y,
         radius: 50,
         fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor,
         strokeWidth: brushWidth,
         shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center',
         id: `circle_${Date.now()}`
       });
       canvas.add(circle);
       canvas.setActiveObject(circle);
       canvas.requestRenderAll();
       setActiveTool('SELECT');
    } else if (activeTool === 'TRIANGLE') {
       const center = canvas.getVpCenter();
       const triangle = new window.fabric.Triangle({
         left: center.x, top: center.y,
         width: 100, height: 100,
         fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor,
         strokeWidth: brushWidth,
         shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center',
         id: `triangle_${Date.now()}`
       });
       canvas.add(triangle);
       canvas.setActiveObject(triangle);
       canvas.requestRenderAll();
       setActiveTool('SELECT');
    } else if (activeTool === 'LINE') {
       const center = canvas.getVpCenter();
       const line = new window.fabric.Line([center.x - 50, center.y, center.x + 50, center.y], {
         stroke: brushColor,
         strokeWidth: brushWidth,
         shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center',
         id: `line_${Date.now()}`
       });
       canvas.add(line);
       canvas.setActiveObject(line);
       canvas.requestRenderAll();
       setActiveTool('SELECT');
    } else if (activeTool === 'STAR') {
       const center = canvas.getVpCenter();
       const points = [];
       const numPoints = 5;
       const innerRadius = 20;
       const outerRadius = 50;
       for (let i = 0; i < numPoints * 2; i++) {
         const radius = i % 2 === 0 ? outerRadius : innerRadius;
         const angle = (Math.PI * i) / numPoints;
         points.push({
           x: radius * Math.sin(angle),
           y: -radius * Math.cos(angle)
         });
       }
       const star = new window.fabric.Polygon(points, {
         left: center.x, top: center.y,
         fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor,
         strokeWidth: brushWidth,
         shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center',
         id: `star_${Date.now()}`
       });
       canvas.add(star);
       canvas.setActiveObject(star);
       canvas.requestRenderAll();
       setActiveTool('SELECT');
    } else if (activeTool === 'POLYGON') {
       const center = canvas.getVpCenter();
       const points = [];
       const numPoints = 6; // Hexagon
       const radius = 50;
       for (let i = 0; i < numPoints; i++) {
         const angle = (Math.PI * 2 * i) / numPoints;
         points.push({
           x: radius * Math.cos(angle),
           y: radius * Math.sin(angle)
         });
       }
       const poly = new window.fabric.Polygon(points, {
         left: center.x, top: center.y,
         fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor,
         strokeWidth: brushWidth,
         shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center',
         id: `poly_${Date.now()}`
       });
       canvas.add(poly);
       canvas.setActiveObject(poly);
       canvas.requestRenderAll();
       setActiveTool('SELECT');
     } else if (activeTool === 'ARROW') {
       const center = canvas.getVpCenter();
       const arrowLine = new window.fabric.Line([center.x - 80, center.y, center.x + 80, center.y], {
         stroke: brushColor, strokeWidth: brushWidth, selectable: false, evented: false,
       });
       const arrowHead = new window.fabric.Polygon([{ x: 0, y: -10 }, { x: 18, y: 0 }, { x: 0, y: 10 }], {
         fill: brushColor, left: center.x + 80, top: center.y, originX: 'center', originY: 'center', selectable: false, evented: false,
       });
       const arrowGrp = new window.fabric.Group([arrowLine, arrowHead], { left: center.x, top: center.y, originX: 'center', originY: 'center', id: `arrow_${Date.now()}` });
       canvas.add(arrowGrp); canvas.setActiveObject(arrowGrp); canvas.requestRenderAll(); setActiveTool('SELECT');
     } else if (activeTool === 'DIAMOND') {
       const center = canvas.getVpCenter();
       const diamond = new window.fabric.Polygon([{ x: 0, y: -60 }, { x: 60, y: 0 }, { x: 0, y: 60 }, { x: -60, y: 0 }], {
         left: center.x, top: center.y, fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor, strokeWidth: brushWidth, shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center', id: `diamond_${Date.now()}`
       });
       canvas.add(diamond); canvas.setActiveObject(diamond); canvas.requestRenderAll(); setActiveTool('SELECT');
     } else if (activeTool === 'SPEECH_BUBBLE') {
       const center = canvas.getVpCenter();
       const bubble = new window.fabric.Path('M -70 -40 Q -70 -70 -40 -70 L 40 -70 Q 70 -70 70 -40 L 70 15 Q 70 45 40 45 L -10 45 L -30 70 L -20 45 L -40 45 Q -70 45 -70 15 Z', {
         left: center.x, top: center.y, fill: isShapeFilled ? brushColor : '#fffde7',
         stroke: brushColor, strokeWidth: brushWidth, shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center', id: `speech_${Date.now()}`
       });
       canvas.add(bubble); canvas.setActiveObject(bubble); canvas.requestRenderAll(); setActiveTool('SELECT');
     } else if (activeTool === 'HEART') {
       const center = canvas.getVpCenter();
       const heart = new window.fabric.Path('M 0 25 C -5 20 -50 -5 -50 -25 C -50 -45 -25 -55 0 -30 C 25 -55 50 -45 50 -25 C 50 -5 5 20 0 25 Z', {
         left: center.x, top: center.y, fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor, strokeWidth: brushWidth, shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center', id: `heart_${Date.now()}`
       });
       canvas.add(heart); canvas.setActiveObject(heart); canvas.requestRenderAll(); setActiveTool('SELECT');
     } else if (activeTool === 'PENTAGON') {
       const center = canvas.getVpCenter();
       const r = 55;
       const pentPts = [];
       for (let i = 0; i < 5; i++) {
         pentPts.push({ x: r * Math.cos(Math.PI * 2 * i / 5 - Math.PI / 2), y: r * Math.sin(Math.PI * 2 * i / 5 - Math.PI / 2) });
       }
       const pent = new window.fabric.Polygon(pentPts, {
         left: center.x, top: center.y, fill: isShapeFilled ? brushColor : 'transparent',
         stroke: brushColor, strokeWidth: brushWidth, shadow: new window.fabric.Shadow({ color: brushColor, blur: 20 }),
         originX: 'center', originY: 'center', id: `pentagon_${Date.now()}`
       });
       canvas.add(pent); canvas.setActiveObject(pent); canvas.requestRenderAll(); setActiveTool('SELECT');
     }

  }, [activeTool, isShapeFilled, brushColor, brushWidth, fontFamily, fontSize, setActiveTool, isViewerUrl]);

  // Update selected objects when props change
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const activeObjects = canvas.getActiveObjects();
    
    activeObjects.forEach((obj: any) => {
      if (obj.type === 'i-text' || obj.type === 'text') {
        obj.set({ fontFamily, fontSize });
      }
      if (obj.stroke !== undefined) obj.set({ stroke: brushColor });
      if (obj.fill !== undefined && obj.fill !== 'transparent') obj.set({ fill: brushColor });
    });
    canvas.requestRenderAll();
  }, [brushColor, fontFamily, fontSize]);

  // Handle Drag & Drop Ingestion
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

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="absolute inset-0 overflow-hidden bg-transparent rounded-2xl border-none"
    >
      <canvas ref={canvasRef} className="block" />
      <DomOverlay />
      <AgentCursor />

      {/* Drag & Drop Visual Dropzone Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-4 z-50 pointer-events-none rounded-3xl border-3 border-dashed border-indigo-500 bg-indigo-50/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-indigo-950 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-bounce">
              <UploadCloud size={32} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-indigo-900 font-sans">
                Lepaskan File di Kanvas
              </h3>
              <p className="text-xs text-indigo-700 font-medium max-w-sm">
                Tarik gambar (.png, .jpg), dokumen (.pdf, .docx), atau catatan (.md) untuk ditaruh langsung ke posisi kursor.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-indigo-600 bg-white/80 px-4 py-1.5 rounded-full border border-indigo-200">
              <span className="flex items-center gap-1"><ImageIcon size={12} /> Gambar</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Sparkles size={12} /> Mermaid Mindmap</span>
              <span>•</span>
              <span className="flex items-center gap-1"><FileText size={12} /> Dokumen</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
