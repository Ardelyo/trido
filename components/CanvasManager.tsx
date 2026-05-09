
import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useAgentProcessor } from '../hooks/useAgentProcessor';
import { AgentCursor } from './AgentCursor';
import { DomOverlay } from './DomOverlay';
import { motion, AnimatePresence } from 'motion/react';

interface CanvasManagerProps {
  onCanvasReady: (canvas: any) => void;
}

export const CanvasManager: React.FC<CanvasManagerProps> = ({ onCanvasReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  
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
        try {
          const previewUrl = canvas.toDataURL({ format: 'png', multiplier: 0.2 });
          useStore.getState().updatePageData(prevPageIndex.current, prevState, prevDom, previewUrl);
        } catch (e) {
          useStore.getState().updatePageData(prevPageIndex.current, prevState, prevDom);
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
        canvas.requestRenderAll();
      }
    };
    window.addEventListener('removeCanvasObject', handleRemoteRemove);

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
    
    onCanvasReady(fabricRef);
    addLog('Pemetaan kanvas aktif.');

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
      canvas.dispose();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('removeCanvasObject', handleRemoteRemove);
    };
  }, []);

  useAgentProcessor(fabricRef);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    
    canvas.freeDrawingBrush = new window.fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;

    if (isViewerUrl) {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'default';
      canvas.getObjects().forEach(o => { o.selectable = false; o.evented = false; });
      canvas.requestRenderAll();
      return;
    }

    if (activeTool === 'PENCIL') {
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

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-transparent rounded-2xl border-none">
      <canvas ref={canvasRef} className="block" />
      <DomOverlay />
      <AgentCursor />
    </div>
  );
};
