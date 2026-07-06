import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store';
import { CONFIG } from '../constants';
import { CanvasJson, ClientToServerEvents, ServerToClientEvents } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('socket-sync');

type BoardSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const useSocketSync = (canvasRef: React.RefObject<any>) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isViewer, setIsViewer] = useState(false);
  const socketRef = useRef<BoardSocket | null>(null);

  const initialDataRef = useRef<CanvasJson | null>(null);

  const isViewerRef = useRef(false);

  useEffect(() => {
    if (!isViewerRef.current) return;

    const interval = setInterval(() => {
      if (canvasRef.current && initialDataRef.current) {
        try {
            canvasRef.current.loadFromJSON(initialDataRef.current, () => {
                canvasRef.current.renderAll();
            });
            initialDataRef.current = null;
            clearInterval(interval);
        } catch(e) {
          logger.error('Failed to load initial canvas data', e);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []); // Only run once

  useEffect(() => {
    // Check if we are in a room from URL
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');

    let currentRoomId = roomParam;
    let isCurrentlyViewer = false;

    if (currentRoomId) {
       isCurrentlyViewer = true;
       isViewerRef.current = true;
       setIsViewer(true);
       setRoomId(currentRoomId);
       useStore.getState().setIsViewerUrl(true);
    } else {
       // We are the host, generate a room ID
       currentRoomId = Math.random().toString(36).substring(2, 9);
       setRoomId(currentRoomId);
    }

    const socketUrl = (import.meta as any).env.VITE_API_URL || window.location.origin;
    const socket: BoardSocket = io(socketUrl, {
      path: '/socket.io'
    });


    socketRef.current = socket;

    socket.on('connect', () => {
      logger.info('Connected to socket server', { socketId: socket.id });
      socket.emit('join-room', currentRoomId);
    });

    socket.on('canvas-init', (data) => {
      logger.debug('Received canvas init');
      if (isCurrentlyViewer && data) {
         if (canvasRef.current) {
             try {
               canvasRef.current.loadFromJSON(data, () => {
                 canvasRef.current.renderAll();
               });
             } catch(e) {
               logger.error('Failed to apply canvas init', e);
             }
         } else {
             initialDataRef.current = data;
         }
      }
    });

    socket.on('canvas-update', (data) => {
      if (isCurrentlyViewer && canvasRef.current && data) {
         try {
           canvasRef.current.loadFromJSON(data, () => {
             canvasRef.current.renderAll();
           });
         } catch(e) {
           logger.error('Failed to apply canvas update', e);
         }
      }
    });

    socket.on('canvas-delta', (delta) => {
      if (isCurrentlyViewer && canvasRef.current && delta) {
         const canvas = canvasRef.current;
         try {
           if (delta.action === 'remove') {
             const toRemove = canvas.getObjects().find((o: any) => o.id === delta.objectId);
             if (toRemove) {
               canvas.remove(toRemove);
               canvas.requestRenderAll();
             }
           } else if (delta.action === 'add' || delta.action === 'modify') {
             const existing = canvas.getObjects().find((o: any) => o.id === delta.objectId);
             if (existing) {
               existing.set(delta.objectData);
               existing.setCoords();
               canvas.requestRenderAll();
             } else {
               window.fabric.util.enlivenObjects([delta.objectData], (objects: any[]) => {
                 if (objects && objects[0]) {
                   // Ensure the object retains its custom properties
                   const obj = objects[0];
                   obj.id = delta.objectId;
                   canvas.add(obj);
                   canvas.requestRenderAll();
                 }
               });
             }
           }
         } catch(e) {
           logger.error('Failed to apply canvas delta update', e);
         }
      }
    });

    socket.on('viewport-update', ({ viewport }) => {
      if (isCurrentlyViewer && canvasRef.current) {
        // Use the viewport to sync camera movement
        if (viewport && Array.isArray(viewport)) {
            canvasRef.current.setViewportTransform(viewport);
            canvasRef.current.requestRenderAll();
        }
      }
    });

    socket.on('dom-elements-init', (data) => {
        if (isCurrentlyViewer && data) {
            useStore.getState().setDomElements(data);
        }
    });

    socket.on('dom-elements-update', (data) => {
        if (isCurrentlyViewer && data) {
            useStore.getState().setDomElements(data);
        }
    });

    socket.on('connect_error', (error) => {
      logger.error('Socket connection error', error);
    });

    socket.on('sync-error', ({ message }) => {
      logger.warn('Socket sync error', { message });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync our local canvas if we are the host via delta updates
  useEffect(() => {
     if (isViewer || !canvasRef.current || !socketRef.current || !roomId) return;
     const canvas = canvasRef.current;
     const socket = socketRef.current;

     const emitDelta = (action: 'add' | 'modify' | 'remove', obj: any) => {
       if (!obj || obj.id === 'agent_cursor' || obj.id === 'spatial_indicator') return;
       
       // Assure object has a unique id
       if (!obj.id) {
         obj.id = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
       }

       const delta = {
         action,
         objectId: obj.id,
         objectData: action !== 'remove' ? obj.toObject(['id', 'zIndex', 'isDomPlaceholder']) : undefined
       };

       socket.emit('canvas-delta', { roomId, delta });
     };

     const handleObjectAdded = (e: any) => emitDelta('add', e.target);
     const handleObjectModified = (e: any) => emitDelta('modify', e.target);
     const handleObjectRemoved = (e: any) => emitDelta('remove', e.target);

     canvas.on('object:added', handleObjectAdded);
     canvas.on('object:modified', handleObjectModified);
     canvas.on('object:removed', handleObjectRemoved);

     return () => {
        canvas.off('object:added', handleObjectAdded);
        canvas.off('object:modified', handleObjectModified);
        canvas.off('object:removed', handleObjectRemoved);
     }
  }, [roomId, isViewer]);

  // Sync our local viewport (camera) if we are the host
  useEffect(() => {
      if (isViewer || !socketRef.current || !roomId) return;

      const unsubscribe = useStore.subscribe((state, prevState) => {
         if (state.viewportTransform !== prevState.viewportTransform) {
            socketRef.current?.emit('viewport-update', {
               roomId,
               viewport: state.viewportTransform
            });
         }
      });

      return unsubscribe;
  }, [roomId, isViewer]);

  // Sync our domElements if we are the host
  useEffect(() => {
      if (isViewer || !socketRef.current || !roomId) return;

      const unsubscribe = useStore.subscribe((state, prevState) => {
          if (state.domElements !== prevState.domElements) {
              socketRef.current?.emit('dom-elements-update', {
                  roomId,
                  domElements: state.domElements
              });
          }
      });

      return unsubscribe;
  }, [roomId, isViewer]);

  return { roomId, isViewer };
};
