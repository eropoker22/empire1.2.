window.Empire = window.Empire || {};

window.Empire.Storage = (() => {
  const runtimeConfig = window.Empire?.RuntimeConfig || null;
  const storage = window.localStorage;
  const storageKeys = runtimeConfig?.storageKeys || {};
  const rawStorage = window.Empire.__storagePatch || {
    getItem: storage.getItem.bind(storage),
    setItem: storage.setItem.bind(storage),
    removeItem: storage.removeItem.bind(storage),
    clear: storage.clear.bind(storage),
    key: storage.key.bind(storage)
  };

  function resolveKey(keyOrAlias) {
    const rawKey = String(keyOrAlias || "").trim();
    if (!rawKey) return "";
    return storageKeys[rawKey] || rawKey;
  }

  function getItem(keyOrAlias) {
    const key = resolveKey(keyOrAlias);
    return key ? storage.getItem(key) : null;
  }

  function setItem(keyOrAlias, value) {
    const key = resolveKey(keyOrAlias);
    if (!key) return;
    storage.setItem(key, String(value));
  }

  function removeItem(keyOrAlias) {
    const key = resolveKey(keyOrAlias);
    if (!key) return;
    storage.removeItem(key);
  }

  function getRawItem(keyOrAlias) {
    const key = resolveKey(keyOrAlias);
    return key ? rawStorage.getItem(key) : null;
  }

  function setRawItem(keyOrAlias, value) {
    const key = resolveKey(keyOrAlias);
    if (!key) return;
    rawStorage.setItem(key, String(value));
  }

  function removeRawItem(keyOrAlias) {
    const key = resolveKey(keyOrAlias);
    if (!key) return;
    rawStorage.removeItem(key);
  }

  return Object.freeze({
    keys: storageKeys,
    resolveKey,
    getItem,
    setItem,
    removeItem,
    getRawItem,
    setRawItem,
    removeRawItem
  });
})();
