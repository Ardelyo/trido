
import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Point } from '../types';

// CONFIG: Human Behavior Emulation
const MIN_REACTION_TIME = 300; 
const MAX_REACTION_TIME = 1000;
const VERIFICATION_PAUSE = 400;

export const useAgentProcessor = (canvasRef: React.MutableRefObject<any>) => {
  const popAction = useStore(state => state.popAction);
  const actionQueue = useStore(state => state.actionQueue);
  const setCursorPosition = useStore(state => state.setCursorPosition);
  const setActing = useStore(state => state.setActing);
  const setClicking = useStore(state => state.setClicking);
  const setCurrentAction = useStore(state => state.setCurrentAction);
  const setSpatialTarget = useStore(state => state.setSpatialTarget);
  const setAccuracy = useStore(state => state.setAccuracy);
  const updateDomElement = useStore(state => state.updateDomElement);
  const removeDomElement = useStore(state => state.removeDomElement);

  const processingRef = useRef(false);

  // --- PHYSICS ENGINE: Cubic Bezier ---
  const getBezierPoint = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  };

  const animateCursorTo = (targetX: number, targetY: number): Promise<void> => {
    return new Promise((resolve) => {
      const startPos = useStore.getState().cursorPosition;
      
      // 1. Calculate Control Points for a natural "Hand Arc"
      const dist = Math.hypot(targetX - startPos.x, targetY - startPos.y);
      const arcScale = Math.min(dist * 0.3, 200); 
      // Flip arc direction randomly
      const side = Math.random() > 0.5 ? 1 : -1;
      
      const cp1 = {
        x: startPos.x + (targetX - startPos.x) * 0.25 + (Math.random() * arcScale * side),
        y: startPos.y + (targetY - startPos.y) * 0.25 + (Math.random() * arcScale * side)
      };
      const cp2 = {
        x: targetX - (targetX - startPos.x) * 0.25 + (Math.random() * (arcScale * 0.5) * side),
        y: targetY - (targetY - startPos.y) * 0.25 + (Math.random() * (arcScale * 0.5) * side)
      };

      // 2. Variable Speed (Fitts's Law approximation)
      const baseTime = 500;
      const travelTime = dist * 0.4;
      const duration = Math.min(1500, Math.max(350, baseTime + travelTime));
      
      const startTime = performance.now();

      const tick = (now: number) => {
        // Abort check
        if (useStore.getState().actionQueue.length === 0 && !processingRef.current) return resolve();

        const elapsed = now - startTime;
        let p = Math.min(elapsed / duration, 1);
        
        // Easing: Ease Out Quart
        const ease = 1 - Math.pow(1 - p, 4);

        const next = getBezierPoint(ease, startPos, cp1, cp2, { x: targetX, y: targetY });
        setCursorPosition(next);

        if (p < 1) requestAnimationFrame(tick);
        else {
          setCursorPosition({ x: targetX, y: targetY }); // Snap
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  };

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  const execute = async (x: number, y: number, label: string, taskFn: () => void) => {
    setCurrentAction(label);
    setSpatialTarget({ x, y });
    setAccuracy(Math.floor(Math.random() * 10) + 90); // Start with high accuracy
    
    // 1. Move
    await animateCursorTo(x, y);
    
    // 2. Think (Cognitive Pause)
    const thinkingTime = Math.random() * (MAX_REACTION_TIME - MIN_REACTION_TIME) + MIN_REACTION_TIME;
    await wait(thinkingTime);

    // 3. Click
    setClicking(true);
    await wait(150);
    setClicking(false);

    // 4. Act
    taskFn();

    // 5. Verify (Post-action pause)
    await wait(VERIFICATION_PAUSE);
    setSpatialTarget(null);
  };

  useEffect(() => {
    const run = async () => {
      if (processingRef.current || actionQueue.length === 0) return;
      
      processingRef.current = true;
      setActing(true);
      const action = popAction();
      
      if (!action || !canvasRef.current) {
        processingRef.current = false;
        setActing(false);
        setCurrentAction(null);
        return;
      }
      
      const canvas = canvasRef.current;

      try {
        switch (action.type) {
          case 'MOVE_CURSOR': {
            await execute(action.payload.x, action.payload.y, 'Observing...', () => {});
            break;
          }

          case 'PAN_CAMERA': {
             const { objectId, direction } = action.payload;
             
             let targetX = 0;
             let targetY = 0;
             let shouldPan = false;

             // Find object location if specified
             if (objectId) {
               const target = canvas.getObjects().find((o: any) => o.id === objectId);
               if (target) {
                 targetX = target.left;
                 targetY = target.top;
                 shouldPan = true;
               }
             } else if (direction) {
                // Pan relative to current view
                const vpt = canvas.viewportTransform;
                const invVpt = window.fabric.util.invertTransform(vpt);
                const center = window.fabric.util.transformPoint({ x: canvas.width / 2, y: canvas.height / 2 }, invVpt);
                const panAmount = Math.max(canvas.width, canvas.height) * 0.5;

                targetX = center.x;
                targetY = center.y;
                if (direction === 'UP') targetY -= panAmount;
                if (direction === 'DOWN') targetY += panAmount;
                if (direction === 'LEFT') targetX -= panAmount;
                if (direction === 'RIGHT') targetX += panAmount;
                shouldPan = true;
             }

             if (shouldPan) {
               await execute(canvas.width / 2, canvas.height / 2, 'Panning...', async () => {
                 const currentVpt = [...canvas.viewportTransform];
                 const zoom = canvas.getZoom();
                 // We want the target location to be at the center of the canvas
                 const destX = (canvas.width / 2) - (targetX * zoom);
                 const destY = (canvas.height / 2) - (targetY * zoom);

                 const startX = currentVpt[4];
                 const startY = currentVpt[5];

                 const steps = 30;
                 for (let i = 1; i <= steps; i++) {
                   const t = i / steps;
                   // EaseInOutQuad
                   const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                   const curX = startX + (destX - startX) * ease;
                   const curY = startY + (destY - startY) * ease;
                   
                   currentVpt[4] = curX;
                   currentVpt[5] = curY;
                   
                   canvas.setViewportTransform([...currentVpt]);
                   useStore.getState().setViewport(zoom, [...currentVpt]);
                   
                   await wait(16); // ~60fps
                 }
               });
             }
             break;
          }

          case 'CREATE_SHAPE': {
            const { shapeType, x, y, width, height, fill, stroke, strokeWidth, text, textColor, fontSize } = action.payload;
            await execute(x, y, `Creating ${shapeType}...`, () => {
              let obj;
              const defaultColor = useStore.getState().theme === 'dark' ? '#ffffff' : '#000000';
              const common = {
                left: x, top: y, width, height,
                fill: fill || defaultColor,
                stroke: stroke || 'transparent',
                strokeWidth: strokeWidth || 0,
                originX: 'center', originY: 'center',
                shadow: new window.fabric.Shadow({
                  color: 'rgba(0,0,0,0.1)',
                  blur: 15,
                  offsetX: 0,
                  offsetY: 6
                }),
                id: `shape_${Date.now()}`
              };

              if (shapeType === 'RECTANGLE') {
                obj = new window.fabric.Rect({ ...common, rx: 12, ry: 12 });
              } else if (shapeType === 'CIRCLE') {
                obj = new window.fabric.Circle({ ...common, radius: width / 2 });
              } else if (shapeType === 'TRIANGLE') {
                obj = new window.fabric.Triangle(common);
              }

              if (obj && text) {
                const effectiveFontSize = fontSize || 18;
                const textWidth = Math.max(50, width - 20); // 10px padding on each side
                const textObj = new window.fabric.Textbox(text, {
                  left: x,
                  top: y,
                  width: textWidth,
                  fontSize: effectiveFontSize,
                  fill: textColor || (useStore.getState().theme === 'dark' ? '#000000' : '#ffffff'),
                  originX: 'center', originY: 'center',
                  fontFamily: 'system-ui, sans-serif',
                  textAlign: 'center',
                  splitByGrapheme: false
                });

                if (shapeType === 'RECTANGLE') {
                  const requiredHeight = Math.max(height, textObj.height + 30);
                  const requiredWidth = Math.max(width, textWidth + 20);
                  obj.set({ width: requiredWidth, height: requiredHeight });
                }

                // Group them so they move together
                obj = new window.fabric.Group([obj, textObj], {
                  left: x, top: y,
                  originX: 'center', originY: 'center',
                  id: `shape_${Date.now()}_group`
                });
              }

              if (obj) {
                canvas.add(obj);
                canvas.requestRenderAll();
              }
            });
            break;
          }

          case 'WRITE_TEXT': {
            const { text, x, y, color, fontSize } = action.payload;
            await execute(x, y, 'Writing...', () => {
              const defaultColor = useStore.getState().theme === 'dark' ? '#ffffff' : '#000000';
              const maxTextWidth = Math.min(400, (canvas.width || 800) - 40);
              const obj = new window.fabric.Textbox(text, {
                left: x, top: y,
                width: maxTextWidth,
                fontFamily: 'system-ui, sans-serif',
                fill: color || defaultColor,
                fontSize: fontSize || 20,
                originX: 'center', originY: 'center',
                textAlign: 'center',
                id: `text_${Date.now()}`
              });
              canvas.add(obj);
              canvas.setActiveObject(obj);
              canvas.requestRenderAll();
            });
            break;
          }

          case 'DRAW_PATH': {
            const { pathSvg, x, y, strokeColor, strokeWidth, fromNodeText, toNodeText, lineStyle } = action.payload;
            if (fromNodeText && toNodeText) {
              // Node connection logic by text label
              const findNodeByText = (text: string) => {
                const search = text.toLowerCase();
                // Find group containing textual match or fallback to closest Match
                const objs = canvas.getObjects().reverse(); // newer first
                for (let o of objs) {
                   if (o.type === 'group') {
                      let match = false;
                      o.getObjects().forEach((inner: any) => {
                         if ((inner.type === 'i-text' || inner.type === 'text' || inner.type === 'textbox') && inner.text && inner.text.toLowerCase().includes(search)) {
                            match = true;
                         }
                      });
                      if (match) return o;
                   } else if ((o.type === 'i-text' || o.type === 'text' || o.type === 'textbox') && o.text && o.text.toLowerCase().includes(search)) {
                     return o;
                   }
                }
                return null;
              };

              const source = findNodeByText(fromNodeText);
              const target = findNodeByText(toNodeText);

              if (source && target) {
                 await execute((source.left + target.left) / 2, (source.top + target.top) / 2, 'Connecting...', () => {
                    const sx = source.left, sy = source.top;
                    const tx = target.left, ty = target.top;
                    let pathStr = `M ${sx} ${sy} L ${tx} ${ty}`;
                    if (lineStyle === 'ARROW_CURVED') {
                       pathStr = `M ${sx} ${sy} Q ${sx + (tx - sx)/2} ${sy - 150} ${tx} ${ty}`;
                    }
                    const path = new window.fabric.Path(pathStr, {
                       fill: 'transparent',
                       stroke: '#3B82F6',
                       strokeWidth: 4,
                       id: `path_${Date.now()}`
                    });
                    canvas.add(path);
                    canvas.sendToBack(path); // put lines behind nodes!
                    canvas.requestRenderAll();
                 });
              } else {
                 console.warn("Could not find nodes:", fromNodeText, toNodeText);
              }
            } else if (pathSvg) {
              await execute(x, y, 'Sketching...', () => {
                const path = new window.fabric.Path(pathSvg);
                path.set({
                  left: x, 
                  top: y,
                  originX: 'center',
                  originY: 'center',
                  fill: 'transparent',
                  stroke: strokeColor || '#ff003c',
                  strokeWidth: strokeWidth || 2,
                  id: `path_${Date.now()}`
                });
                canvas.add(path);
                canvas.requestRenderAll();
              });
            }
            break;
          }

          case 'RENDER_HTML': {
            const { html, x, y, width, height, componentType, config } = action.payload;
            await execute(x, y, 'Compiling App...', () => {
              const id = `web_${Date.now()}`;
              const rect = new window.fabric.Rect({
                left: x, top: y, width: width, height: height,
                fill: 'rgba(255,255,255,0.01)',
                stroke: '#00f0ff', strokeWidth: 1,
                originX: 'center', originY: 'center',
                id: id,
                isDomPlaceholder: true
              });
              canvas.add(rect);
              updateDomElement(id, { id, html, x, y, width, height, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 10, componentType, config });
              canvas.setActiveObject(rect);
              canvas.requestRenderAll();
            });
            break;
          }

          case 'CREATE_SVG': {
            const { svgXml, x, y } = action.payload;
            await execute(x, y, 'Drawing Vector...', () => {
              window.fabric.loadSVGFromString(svgXml, (objs: any[], opts: any) => {
                if(!objs?.length) return;
                const grp = window.fabric.util.groupSVGElements(objs, opts);
                grp.set({ left: x, top: y, originX: 'center', originY: 'center', id: `svg_${Date.now()}` });
                canvas.add(grp);
                canvas.requestRenderAll();
              });
            });
            break;
          }

          case 'CREATE_IMAGE': {
            const { base64, x, y, width } = action.payload;
            await execute(x, y, 'Placing Asset...', () => {
              window.fabric.Image.fromURL(base64, (img: any) => {
                if (width) img.scaleToWidth(width);
                img.set({ left: x, top: y, originX: 'center', originY: 'center', id: `img_${Date.now()}` });
                canvas.add(img);
                canvas.requestRenderAll();
              });
            });
            break;
          }

          case 'EDIT_HTML': {
            const { objectId, config } = action.payload;
            const target = canvas.getObjects().find((o: any) => o.id === objectId);
            if (target) {
              await execute(target.left, target.top, 'Updating Component...', () => {
                updateDomElement(objectId, { config });
              });
            }
            break;
          }

          case 'DRAG_OBJECT': {
            const { objectId, toX, toY } = action.payload;
            const target = canvas.getObjects().find((o: any) => o.id === objectId);
            if (target) {
              // 1. Go to Object
              await animateCursorTo(target.left, target.top);
              setCurrentAction('Grabbing...');
              setClicking(true);
              await wait(200);

              // 2. Drag to Dest
              setCurrentAction('Moving...');
              const startX = target.left;
              const startY = target.top;
              const steps = 30;
              
              for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                // EaseInOutQuad
                const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const curX = startX + (toX - startX) * ease;
                const curY = startY + (toY - startY) * ease;
                
                target.set({ left: curX, top: curY });
                target.setCoords();
                if(target.isDomPlaceholder) updateDomElement(target.id, { x: curX, y: curY });
                
                setCursorPosition({ x: curX, y: curY });
                canvas.requestRenderAll();
                await wait(16); // ~60fps
              }
              
              setClicking(false);
              await wait(200);
            }
            break;
          }

          case 'RESIZE_OBJECT': {
            const { objectId, width, height } = action.payload;
            const target = canvas.getObjects().find((o: any) => o.id === objectId);
            if (target) {
              await execute(target.left, target.top, 'Resizing...', () => {
                if (target.isDomPlaceholder) {
                  target.set({ width, height, scaleX: 1, scaleY: 1 });
                  updateDomElement(objectId, { width, height });
                } else {
                  target.set({ 
                    scaleX: width / target.width, 
                    scaleY: height / target.height 
                  });
                }
                target.setCoords();
                canvas.requestRenderAll();
              });
            }
            break;
          }

          case 'MODIFY_PROPERTY': {
             const { objectId, property, value } = action.payload;
             const target = canvas.getObjects().find((o: any) => o.id === objectId);
             if (target) {
                await execute(target.left, target.top, `Updating...`, () => {
                   if (property === 'text' && target.isType('group')) {
                      target.getObjects().forEach((o: any) => {
                         if (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox') o.set('text', value);
                      });
                      canvas.requestRenderAll();
                   } else if (property === 'text') {
                      target.set('text', value);
                      canvas.requestRenderAll();
                   }
                });
             }
             break;
          }

          case 'DELETE_OBJECT': {
             const { objectId } = action.payload;
             const target = canvas.getObjects().find((o: any) => o.id === objectId);
             if (target) {
               await execute(target.left, target.top, 'Deleting...', () => {
                 canvas.remove(target);
                 if(target.isDomPlaceholder) removeDomElement(objectId);
                 canvas.requestRenderAll();
               });
             }
             break;
          }
        }
      } catch (err) {
        console.error("Action failed:", err);
      }

      processingRef.current = false;
      setActing(false);
      setCurrentAction(null);
    };

    const timer = setInterval(run, 100);
    return () => clearInterval(timer);
  }, [actionQueue, canvasRef]);
};
