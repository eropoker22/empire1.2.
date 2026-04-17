window.Empire = window.Empire || {};
window.Empire.UIHelpers = window.Empire.UIHelpers || {};

window.Empire.UIHelpers.createStorageHelpers = function createStorageHelpers(deps = {}) {
  const { storage = null } = deps;

  function readStoredValue(key) {
    if (storage?.getItem) {
      return storage.getItem(key);
    }
    return localStorage.getItem(key);
  }

  function removeStoredValue(key) {
    if (storage?.removeItem) {
      storage.removeItem(key);
      return;
    }
    localStorage.removeItem(key);
  }

  function writeStoredValue(key, value) {
    if (value == null) {
      removeStoredValue(key);
      return;
    }
    if (storage?.setItem) {
      storage.setItem(key, value);
      return;
    }
    localStorage.setItem(key, value);
  }

  function readStoredObject(key) {
    try {
      const parsed = JSON.parse(readStoredValue(key) || "null");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return {};
  }

  function writeStoredObject(key, value) {
    writeStoredValue(key, JSON.stringify(value || {}));
  }

  return {
    readStoredValue,
    writeStoredValue,
    removeStoredValue,
    readStoredObject,
    writeStoredObject
  };
};
