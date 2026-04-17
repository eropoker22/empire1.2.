const { WebSocketServer } = require("ws");
const { authenticateSocket } = require("./wsAuth");
const { handleMessage } = require("./wsHandlers");

let wss = null;
const rooms = new Map();
const HEARTBEAT_INTERVAL_MS = 30000;
const MAX_MESSAGE_BYTES = 64 * 1024;
const AUTH_HANDSHAKE_TIMEOUT_MS = 5000;

function cleanupSocketSubscriptions(socket) {
  for (const key of socket.subscriptions) {
    const room = rooms.get(key);
    if (!room) continue;
    room.delete(socket);
    if (room.size === 0) rooms.delete(key);
  }
}

function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (socket, req) => {
    socket.isAlive = true;
    socket.isAuthenticated = false;
    socket.subscriptions = new Set();
    socket.authHandshakeTimer = setTimeout(() => {
      if (!socket.isAuthenticated) {
        try {
          socket.send(JSON.stringify({ type: "error", error: "auth_timeout" }));
        } catch (err) {
          // Ignore send errors on closing socket.
        }
        socket.close(1008, "auth_timeout");
      }
    }, AUTH_HANDSHAKE_TIMEOUT_MS);

    socket.send(JSON.stringify({ type: "auth:required", timeoutMs: AUTH_HANDSHAKE_TIMEOUT_MS }));

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (data) => {
      const sizeBytes = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(String(data || ""));
      if (sizeBytes > MAX_MESSAGE_BYTES) {
        socket.send(JSON.stringify({ type: "error", error: "payload_too_large" }));
        socket.close(1009, "payload_too_large");
        return;
      }

      let payload = null;
      try {
        payload = JSON.parse(data.toString());
      } catch (err) {
        socket.send(JSON.stringify({ type: "error", error: "invalid_json" }));
        return;
      }

      if (!socket.isAuthenticated) {
        if (payload?.type !== "auth") {
          socket.send(JSON.stringify({ type: "error", error: "auth_required" }));
          return;
        }

        const result = authenticateSocket(socket, payload?.token);
        if (!result.ok) {
          socket.send(JSON.stringify({ type: "error", error: result.error }));
          socket.close(1008, "auth_failed");
          return;
        }

        if (socket.authHandshakeTimer) {
          clearTimeout(socket.authHandshakeTimer);
          socket.authHandshakeTimer = null;
        }

        socket.send(JSON.stringify({
          type: "auth:ok",
          user: {
            id: socket.user?.id || null,
            gameMode: socket.user?.gameMode || "war",
            serverKey: socket.user?.serverKey || ""
          }
        }));
        return;
      }

      handleMessage({ socket, payload, rooms });
    });

    socket.on("close", () => {
      if (socket.authHandshakeTimer) {
        clearTimeout(socket.authHandshakeTimer);
        socket.authHandshakeTimer = null;
      }
      cleanupSocketSubscriptions(socket);
    });
  });

  const interval = setInterval(() => {
    for (const socket of wss.clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => clearInterval(interval));
}

function getWebSocketServer() {
  return wss;
}

function getRoomRegistry() {
  return rooms;
}

module.exports = { initWebSocket, getWebSocketServer, getRoomRegistry };
