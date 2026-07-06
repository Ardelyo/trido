import "dotenv/config";
// Suppress @google/genai SDK internal warning about non-text function-call parts.
// The SDK logs this unconditionally at response construction — we extract parts
// directly from candidates[0].content.parts so this warning is a false positive.
const _consoleWarn = console.warn.bind(console);
console.warn = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('non-text parts') && msg.includes('functionCall'))
        return;
    _consoleWarn(...args);
};
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import { aiRouter } from "./server/aiRouter";
import { CONFIG } from "./constants";
import { createLogger } from "./utils/logger";
const logger = createLogger('server');
// Rooms file: configurable via env, defaults to cwd.
// On ephemeral hosts (Render, Railway) this resets on deploy — that is expected
// for a demo environment. Point ROOMS_FILE_PATH to a mounted volume for persistence.
const ROOMS_FILE = process.env.ROOMS_FILE_PATH ||
    path.join(process.cwd(), CONFIG.server.roomsPersistenceFile);
let saveTimeout = null;
let isSaving = false;
let pendingSave = false;
function saveRooms(rooms) {
    if (isSaving) {
        pendingSave = true;
        return;
    }
    if (saveTimeout)
        return;
    saveTimeout = setTimeout(async () => {
        saveTimeout = null;
        isSaving = true;
        try {
            const data = JSON.stringify(Array.from(rooms.entries()));
            const tempFile = `${ROOMS_FILE}.tmp`;
            await fs.promises.writeFile(tempFile, data, "utf8");
            await fs.promises.rename(tempFile, ROOMS_FILE);
        }
        catch (e) {
            logger.error("Async save rooms failed", e);
        }
        finally {
            isSaving = false;
            if (pendingSave) {
                pendingSave = false;
                saveRooms(rooms);
            }
        }
    }, 2000); // 2-second write coalescing debounce
}
function loadRooms() {
    try {
        if (fs.existsSync(ROOMS_FILE)) {
            const data = fs.readFileSync(ROOMS_FILE, 'utf8');
            return new Map(JSON.parse(data));
        }
    }
    catch (e) {
        logger.error("Failed to load rooms", e);
    }
    return new Map();
}
async function startServer() {
    const app = express();
    const PORT = Number(process.env.SERVER_PORT || CONFIG.server.defaultPort);
    // CORS: lock to specific origin in production via ALLOWED_ORIGIN env var.
    // Falls back to * in development only.
    const allowedOrigin = process.env.ALLOWED_ORIGIN ||
        (process.env.NODE_ENV === 'production' ? false : '*');
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigin,
            methods: ["GET", "POST"]
        }
    });
    // State management for canvas
    const rooms = loadRooms();
    io.on("connection", (socket) => {
        logger.info("Client connected", { socketId: socket.id });
        socket.on("join-room", (roomId) => {
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
        // Receive incremental canvas object delta updates
        socket.on("canvas-delta", ({ roomId, delta }) => {
            const room = rooms.get(roomId);
            if (room) {
                if (room.state && !Array.isArray(room.state)) {
                    const stateObj = room.state;
                    if (!stateObj.objects) {
                        stateObj.objects = [];
                    }
                    const objects = stateObj.objects;
                    if (delta.action === "add" || delta.action === "modify") {
                        const idx = objects.findIndex((o) => o.id === delta.objectId);
                        if (idx >= 0) {
                            objects[idx] = delta.objectData;
                        }
                        else {
                            objects.push(delta.objectData);
                        }
                    }
                    else if (delta.action === "remove") {
                        stateObj.objects = objects.filter((o) => o.id !== delta.objectId);
                    }
                }
                else if (Array.isArray(room.state)) {
                    const objects = room.state;
                    if (delta.action === "add" || delta.action === "modify") {
                        const idx = objects.findIndex((o) => o.id === delta.objectId);
                        if (idx >= 0) {
                            objects[idx] = delta.objectData;
                        }
                        else {
                            objects.push(delta.objectData);
                        }
                    }
                    else if (delta.action === "remove") {
                        room.state = objects.filter((o) => o.id !== delta.objectId);
                    }
                }
                saveRooms(rooms);
            }
            socket.to(roomId).emit("canvas-delta", delta);
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
    app.get("/api/health", (_req, res) => {
        res.json({
            status: "ok",
            env: process.env.NODE_ENV || 'development',
            aiMode: process.env.AI_MODE || 'auto',
            version: process.env.npm_package_version || '1.0.0'
        });
    });
    app.use("/api/ai", aiRouter);
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
        // APP_DIST_PATH is set by Electron before requiring this bundle.
        // Falls back to process.cwd()/dist for normal tsx production runs.
        const distPath = process.env.APP_DIST_PATH || path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get(/^\/(?!api).*/, (_req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
    httpServer.listen(PORT, CONFIG.server.host, () => {
        logger.info(`Server running on http://localhost:${PORT}`);
    });
}
startServer();
