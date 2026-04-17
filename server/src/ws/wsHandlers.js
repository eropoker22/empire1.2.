const { broadcastToRoom } = require("./wsBroadcast");

const PRE_AUTH_ALLOWED_EVENTS = new Set();
const POST_AUTH_ALLOWED_EVENTS = new Set([
  "map:subscribe",
  "map:unsubscribe",
  "market:subscribe",
  "market:unsubscribe",
  "chat:ping",
  "district:update"
]);

function resolveRoomMode(socket) {
  return String(socket.user?.gameMode || "war").toLowerCase();
}

function resolveRoomServer(socket) {
  return String(socket.user?.serverKey || "").trim().toLowerCase();
}

function ensureRoom(rooms, key) {
  if (!rooms.has(key)) {
    rooms.set(key, new Set());
  }
  return rooms.get(key);
}

function subscribeSocketToRoom(socket, rooms, key) {
  const room = ensureRoom(rooms, key);
  room.add(socket);
  socket.subscriptions.add(key);
}

function unsubscribeSocketFromRoom(socket, rooms, key) {
  const room = rooms.get(key);
  if (room) {
    room.delete(socket);
    if (room.size === 0) rooms.delete(key);
  }
  socket.subscriptions.delete(key);
}

function handleMessage({ socket, payload, rooms }) {
  if (!payload || typeof payload.type !== "string") {
    return;
  }

  if (!socket.isAuthenticated && !PRE_AUTH_ALLOWED_EVENTS.has(payload.type)) {
    socket.send(JSON.stringify({ type: "error", error: "auth_required" }));
    return;
  }

  if (socket.isAuthenticated && !POST_AUTH_ALLOWED_EVENTS.has(payload.type)) {
    socket.send(JSON.stringify({ type: "error", error: "unknown_event" }));
    return;
  }

  const roomMode = resolveRoomMode(socket);
  const roomServer = resolveRoomServer(socket);
  const handlers = {
    "map:subscribe": () => subscribeSocketToRoom(socket, rooms, `map:${roomServer || roomMode}`),
    "map:unsubscribe": () => unsubscribeSocketFromRoom(socket, rooms, `map:${roomServer || roomMode}`),
    "market:subscribe": () => subscribeSocketToRoom(socket, rooms, `market:${roomServer || roomMode}`),
    "market:unsubscribe": () => unsubscribeSocketFromRoom(socket, rooms, `market:${roomServer || roomMode}`),
    "chat:ping": () => {
      socket.send(JSON.stringify({ type: "chat:pong", ts: Date.now() }));
    },
    "district:update": () => {
      // Server authoritative. Ignore client-origin update requests.
      socket.send(JSON.stringify({ type: "error", error: "forbidden" }));
    }
  };

  const handler = handlers[payload.type];
  if (handler) {
    handler();
  } else {
    socket.send(JSON.stringify({ type: "error", error: "unknown_event" }));
  }
}

function broadcastMapUpdate({ rooms, update, serverKey = "", gameMode = "war" }) {
  const roomKey = String(serverKey || "").trim().toLowerCase() || String(gameMode || "war").toLowerCase();
  broadcastToRoom(rooms, `map:${roomKey}`, { type: "map:update", data: update });
}

function broadcastMarketUpdate({ rooms, update, serverKey = "", gameMode = "war" }) {
  const roomKey = String(serverKey || "").trim().toLowerCase() || String(gameMode || "war").toLowerCase();
  broadcastToRoom(rooms, `market:${roomKey}`, { type: "market:update", data: update });
}

module.exports = { handleMessage, broadcastMapUpdate, broadcastMarketUpdate };
