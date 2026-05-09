import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // State management for canvas
  const rooms = new Map<string, { 
    state: any[], 
    viewports: Record<string, any>,
    lastViewport?: any,
    domElements?: any
  }>();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { state: [], viewports: {}, domElements: {}, lastViewport: null } as any);
      }
      
      const roomData = rooms.get(roomId);
      // Send current state to newly joined client
      socket.emit("canvas-init", roomData?.state || []);
      if (roomData?.lastViewport) {
        socket.emit("viewport-update", { socketId: 'host', viewport: roomData.lastViewport });
      }
      if (roomData?.domElements) {
        socket.emit("dom-elements-init", roomData.domElements);
      }
      
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Receive full or incremental canvas updates
    socket.on("canvas-update", ({ roomId, data }) => {
      // In a real app we might handle partial updates
      // Here we might just broadcast to others in the room
      const room = rooms.get(roomId);
      if (room) {
        room.state = data;
      }
      socket.to(roomId).emit("canvas-update", data);
    });

    // Receive viewport updates
    socket.on("viewport-update", ({ roomId, viewport }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.viewports[socket.id] = viewport;
        room.lastViewport = viewport;
      }
      socket.to(roomId).emit("viewport-update", {
        socketId: socket.id,
        viewport
      });
    });

    socket.on("dom-elements-update", ({ roomId, domElements }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.domElements = domElements;
      }
      socket.to(roomId).emit("dom-elements-update", domElements);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
