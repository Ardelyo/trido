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
          logger.debug('Failed to load initial canvas data', e);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
       currentRoomId = Math.random().toString(36).substring(2, 9);
       setRoomId(currentRoomId);
    }

    // Only attempt socket connection if on localhost or if VITE_API_URL is configured
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const customApiUrl = (import.meta as any).env.VITE_API_URL;
    const isVercel = window.location.hostname.includes('vercel.app');

    // On Vercel without a custom stateful backend, serverless environment does not support WebSockets
    if (isVercel && !customApiUrl) {
      logger.debug('Socket sync disabled: running on Vercel without external VITE_API_URL stateful backend');
      return;
    }

    const shouldConnect = Boolean(customApiUrl || isLocalhost || (isCurrentlyViewer && !isVercel));

    if (!shouldConnect) {
      logger.debug('Running in standalone client mode (socket sync disabled)');
      return;
    }

    const socketUrl = customApiUrl || window.location.origin;
    let failedAttempts = 0;

    const socket: BoardSocket = io(socketUrl, {
      path: '/socket.io',
      reconnectionAttempts: 1,
      timeout: 2500,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      failedAttempts++;
      if (failedAttempts <= 1) {
        logger.debug('Socket connection unavailable, continuing in offline/standalone mode', err.message);
      }
      socket.disconnect();
    });

    socket.on('connect', () => {
      failedAttempts = 0;
      logger.info('Connected to socket server', { socketId: socket.id });
      socket.emit('join-room', currentRoomId);
    });

    socket.on('canvas-init', (data) => {
      if (isCurrentlyViewer && data) {
         if (canvasRef.current) {
             try {
               canvasRef.current.loadFromJSON(data, () => {
                 canvasRef.current.renderAll();
               });
             } catch(e) {
               logger.debug('Failed to apply canvas init', e);
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
           logger.debug('Failed to apply canvas update', e);
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
                   const obj = objects[0];
                   obj.id = delta.objectId;
                   canvas.add(obj);
                   canvas.requestRenderAll();
                 }
               });
             }
           }
         } catch(e) {
           logger.debug('Failed to apply canvas delta update', e);
         }
      }
    });

    socket.on('viewport-update', ({ viewport }) => {
      if (isCurrentlyViewer && canvasRef.current) {
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

    socket.on('connect_error', () => {
      failedAttempts++;
      if (failedAttempts >= 2) {
        logger.debug('Socket relay unavailable, operating in offline/standalone mode');
        socket.disconnect();
      }
    });

    socket.on('sync-error', ({ message }) => {
      logger.debug('Socket sync error', { message });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync local canvas if host
  useEffect(() => {
     if (isViewer || !canvasRef.current || !socketRef.current || !roomId) return;
     const canvas = canvasRef.current;
     const socket = socketRef.current;

     const emitDelta = (action: 'add' | 'modify' | 'remove', obj: any) => {
       if (!obj || obj.id === 'agent_cursor' || obj.id === 'spatial_indicator') return;
       if (!socket.connected) return;
       
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
     };
  }, [roomId, isViewer]);

  // Sync viewport if host
  useEffect(() => {
      if (isViewer || !socketRef.current || !roomId) return;

      const unsubscribe = useStore.subscribe((state, prevState) => {
         if (state.viewportTransform !== prevState.viewportTransform && socketRef.current?.connected) {
            socketRef.current.emit('viewport-update', {
               roomId,
               viewport: state.viewportTransform
            });
         }
      });

      return unsubscribe;
  }, [roomId, isViewer]);

  // Sync domElements if host
  useEffect(() => {
      if (isViewer || !socketRef.current || !roomId) return;

      const unsubscribe = useStore.subscribe((state, prevState) => {
          if (state.domElements !== prevState.domElements && socketRef.current?.connected) {
              socketRef.current.emit('dom-elements-update', {
                  roomId,
                  domElements: state.domElements
              });
          }
      });

      return unsubscribe;
  }, [roomId, isViewer]);

  return { roomId, isViewer };
};
