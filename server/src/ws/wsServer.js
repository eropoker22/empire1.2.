const { WebSocketServer } = require("ws");
const { verifySocketToken } = require("./wsAuth");
const { handleMessage } = require("./wsHandlers");

let wss = null;
const rooms = new Map();

function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const user = verifySocketToken(token);

    if (!user) {
      socket.close(1008, "unauthorized");
      return;
    }

    socket.user = user;
    socket.isAlive = true;
    socket.subscriptions = new Set();

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", (data) => {
      let payload = null;
      try {
        payload = JSON.parse(data.toString());
      } catch (err) {
        socket.send(JSON.stringify({ type: "error", error: "invalid_json" }));
        return;
      }

      handleMessage({ socket, payload, rooms });
    });

    socket.on("close", () => {
      for (const key of socket.subscriptions) {
        const room = rooms.get(key);
        if (room) {
          room.delete(socket);
          if (room.size === 0) rooms.delete(key);
        }
      }
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
  }, 30000);

  wss.on("close", () => clearInterval(interval));
}

function getWebSocketServer() {
  return wss;
}

function getRoomRegistry() {
  return rooms;
}

module.exports = { initWebSocket, getWebSocketServer, getRoomRegistry };
