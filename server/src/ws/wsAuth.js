const jwt = require("jsonwebtoken");

function verifySocketToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authenticateSocket(socket, token) {
  const user = verifySocketToken(token);
  if (!user) {
    return { ok: false, error: "auth_failed" };
  }

  socket.user = user;
  socket.isAuthenticated = true;
  return { ok: true, user };
}

module.exports = { verifySocketToken, authenticateSocket };
