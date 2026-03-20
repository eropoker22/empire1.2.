const jwt = require("jsonwebtoken");

function verifySocketToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { verifySocketToken };
