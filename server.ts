import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import { aiRouter } from "./server/aiRouter";
import { CONFIG } from "./constants";
import { ClientToServerEvents, RoomState, ServerToClientEvents, SocketData, SocketInterServerEvents } from "./types";
import { createLogger } from "./utils/logger";

const logger = createLogger('server');
const ROOMS_FILE = path.join(process.cwd(), CONFIG.server.roomsPersistenceFile);

function saveRooms(rooms: Map<string, RoomState>) {
  try {
    const data = JSON.stringify(Array.from(rooms.entries()));
    fs.writeFileSync(ROOMS_FILE, data);
  } catch (e) {
    logger.error("Failed to save rooms", e);
  }
}

function loadRooms(): Map<string, RoomState> {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const data = fs.readFileSync(ROOMS_FILE, 'utf8');
      return new Map(JSON.parse(data));
    }
  } catch (e) {
    logger.error("Failed to load rooms", e);
  }
  return new Map();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.SERVER_PORT || CONFIG.server.defaultPort);

  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents, SocketInterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // State management for canvas
  const rooms = loadRooms();

  io.on("connection", (socket) => {
    logger.info("Client connected", { socketId: socket.id });

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { state: [], viewports: {}, domElements: {}, lastViewport: null });
        saveRooms(rooms);
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

      logger.info("Socket joined room", { socketId: socket.id, roomId });
    });

    // Receive full or incremental canvas updates
    socket.on("canvas-update", ({ roomId, data }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.state = data;
        saveRooms(rooms);
      }
      socket.to(roomId).emit("canvas-update", data);
    });

    // Receive viewport updates
    socket.on("viewport-update", ({ roomId, viewport }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.viewports[socket.id] = viewport;
        room.lastViewport = viewport;
        saveRooms(rooms);
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
        saveRooms(rooms);
      }
      socket.to(roomId).emit("dom-elements-update", domElements);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected", { socketId: socket.id });
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/ai", aiRouter);

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

  httpServer.listen(PORT, CONFIG.server.host, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
