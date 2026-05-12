export function hideElement(element) {
  if (!element) {
    return false;
  }

  element.hidden = true;
  return true;
}

export function hideElements(elements = []) {
  let changed = false;
  for (const element of elements) {
    changed = hideElement(element) || changed;
  }
  return changed;
}

export function isElementVisible(element) {
  return Boolean(element && !element.hidden);
}

export function isClassModalVisible(element, hiddenClass = "hidden") {
  return Boolean(element && !element.classList.contains(hiddenClass));
}

export function bindEscapeKeyHandlers(documentRef, handlers = []) {
  if (!documentRef?.addEventListener) {
    return false;
  }

  documentRef.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    for (const handler of handlers) {
      const element = typeof handler.element === "function" ? handler.element() : handler.element;
      const isOpen = typeof handler.isOpen === "function"
        ? handler.isOpen(element)
        : isElementVisible(element);

      if (isOpen && typeof handler.close === "function") {
        handler.close(element, event);
      }
    }
  });

  return true;
}
