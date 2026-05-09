import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store';

export const useSocketSync = (canvasRef: React.RefObject<any>) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isViewer, setIsViewer] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  const initialDataRef = useRef<any>(null);
  
  // Apply initial data if canvas becomes available
  useEffect(() => {
    if (isViewer && canvasRef.current && initialDataRef.current) {
        try {
            canvasRef.current.loadFromJSON(initialDataRef.current, () => {
                canvasRef.current.renderAll();
            });
            initialDataRef.current = null;
        } catch(e) {}
    }
  }, [canvasRef.current, isViewer]);
  
  useEffect(() => {
    // Check if we are in a room from URL
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    
    let currentRoomId = roomParam;
    let isCurrentlyViewer = false;
    
    if (currentRoomId) {
       isCurrentlyViewer = true;
       setIsViewer(true);
       setRoomId(currentRoomId);
       useStore.getState().setIsViewerUrl(true);
    } else {
       // We are the host, generate a room ID
       currentRoomId = Math.random().toString(36).substring(2, 9);
       setRoomId(currentRoomId);
    }

    const socket = io(window.location.origin, {
      path: '/socket.io'
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('join-room', currentRoomId);
    });

    socket.on('canvas-init', (data) => {
      console.log('Received canvas init:', data);
      if (isCurrentlyViewer && data) {
         if (canvasRef.current) {
             try {
               canvasRef.current.loadFromJSON(data, () => {
                 canvasRef.current.renderAll();
               });
             } catch(e) {}
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
         } catch(e) {}
      }
    });

    socket.on('viewport-update', ({ socketId, viewport }) => {
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

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync our local canvas if we are the host
  useEffect(() => {
     if (isViewer || !canvasRef.current || !socketRef.current || !roomId) return;
     const canvas = canvasRef.current;

     let timeout: any;
     const handleCanvasChange = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
           const json = canvas.toJSON(['id', 'zIndex', 'isDomPlaceholder']);
           socketRef.current?.emit('canvas-update', { roomId, data: json });
        }, 300); // 300ms debounce
     };

     canvas.on('object:modified', handleCanvasChange);
     canvas.on('object:added', handleCanvasChange);
     canvas.on('object:removed', handleCanvasChange);
     canvas.on('path:created', handleCanvasChange);

     return () => {
        canvas.off('object:modified', handleCanvasChange);
        canvas.off('object:added', handleCanvasChange);
        canvas.off('object:removed', handleCanvasChange);
        canvas.off('path:created', handleCanvasChange);
        clearTimeout(timeout);
     }
  }, [roomId, isViewer, canvasRef.current]);

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
