function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((toNumber(part) / toNumber(total)) * 100);
}

function formatRelativeActivity(updatedAt) {
  if (!updatedAt) return "neznámá aktivita";
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `před ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `před ${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  return `před ${diffHour}h`;
}

function splitAcrossServers(total, serverCount, minFloor = 0) {
  const count = Math.max(1, toNumber(serverCount, 1));
  const base = Math.floor(total / count);
  const result = Array.from({ length: count }).map(() => Math.max(minFloor, base));
  let used = result.reduce((acc, value) => acc + value, 0);
  let idx = 0;
  while (used < total) {
    result[idx % count] += 1;
    used += 1;
    idx += 1;
  }
  return result;
}

module.exports = {
  toNumber,
  pct,
  formatRelativeActivity,
  splitAcrossServers
};
