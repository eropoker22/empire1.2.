function broadcastToAll(wss, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

function broadcastToRoom(roomMap, roomKey, payload) {
  const room = roomMap.get(roomKey);
  if (!room) return;
  const message = JSON.stringify(payload);
  for (const client of room) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

module.exports = {
  broadcastToAll,
  broadcastToRoom
};
