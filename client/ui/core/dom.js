window.Empire = window.Empire || {};
window.Empire.UIDom = window.Empire.UIDom || {};

window.Empire.UIDom.byId = function byId(id) {
  return document.getElementById(String(id || ""));
};

window.Empire.UIDom.query = function query(root, selector) {
  if (!root || !selector) return null;
  return root.querySelector(selector);
};

window.Empire.UIDom.queryAll = function queryAll(root, selector) {
  if (!root || !selector) return [];
  return Array.from(root.querySelectorAll(selector));
};
