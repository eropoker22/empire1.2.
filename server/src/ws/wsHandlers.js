const { broadcastToRoom } = require("./wsBroadcast");

function handleMessage({ socket, payload, rooms }) {
  if (!payload || typeof payload.type !== "string") {
    return;
  }

  switch (payload.type) {
    case "map:subscribe": {
      const key = "map";
      if (!rooms.has(key)) {
        rooms.set(key, new Set());
      }
      rooms.get(key).add(socket);
      socket.subscriptions.add(key);
      break;
    }
    case "map:unsubscribe": {
      const key = "map";
      if (rooms.has(key)) {
        rooms.get(key).delete(socket);
      }
      socket.subscriptions.delete(key);
      break;
    }
    case "market:subscribe": {
      const key = "market";
      if (!rooms.has(key)) {
        rooms.set(key, new Set());
      }
      rooms.get(key).add(socket);
      socket.subscriptions.add(key);
      break;
    }
    case "market:unsubscribe": {
      const key = "market";
      if (rooms.has(key)) {
        rooms.get(key).delete(socket);
      }
      socket.subscriptions.delete(key);
      break;
    }
    case "chat:ping": {
      socket.send(JSON.stringify({ type: "chat:pong", ts: Date.now() }));
      break;
    }
    case "district:update": {
      // Server authoritative. Ignore client-origin update requests.
      socket.send(JSON.stringify({ type: "error", error: "forbidden" }));
      break;
    }
    default:
      socket.send(JSON.stringify({ type: "error", error: "unknown_event" }));
  }
}

function broadcastMapUpdate({ rooms, update }) {
  broadcastToRoom(rooms, "map", { type: "map:update", data: update });
}

function broadcastMarketUpdate({ rooms, update }) {
  broadcastToRoom(rooms, "market", { type: "market:update", data: update });
}

module.exports = { handleMessage, broadcastMapUpdate, broadcastMarketUpdate };
