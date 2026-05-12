export function collectMounts(root, selector) {
  if (!root?.querySelectorAll || !selector) {
    return [];
  }

  return Array.from(root.querySelectorAll(selector))
    .filter((element) => element !== root)
    .map((element) => ({
      id: element.id,
      role: element.dataset.mountRole || "generic",
      node: element
    }));
}

export function createPageContext(root, selector) {
  const mounts = collectMounts(root, selector);
  const mountsByRole = Object.fromEntries(
    mounts.map((mount) => [mount.role, mount.node])
  );

  return {
    name: root?.dataset?.page || "unknown",
    root,
    mounts,
    mountsByRole
  };
}

export function markMounts(context) {
  for (const mount of context?.mounts || []) {
    mount.node.dataset.mountReady = "true";
  }
}
