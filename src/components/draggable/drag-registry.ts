import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import type { DragRegistryContextValue, DragRegistryKey } from "./drag-registry-context";

/*
 * Registering groups & documents element,
 * so that we can restore focus to the trigger when it moves between columns.
 */
export function createRegistry(): DragRegistryContextValue {
  const documents = new Map<DragRegistryKey["id"], HTMLElement>();
  const groups = new Map<DragRegistryKey["id"], HTMLElement>();

  function registerGroup({ id, entry }: { id: DragRegistryKey["id"]; entry: HTMLElement }): CleanupFn {
    groups.set(id, entry);
    return function cleanup() {
      groups.delete(id);
    };
  }

  function registerDocument({ id, entry }: { id: DragRegistryKey["id"]; entry: HTMLElement }): CleanupFn {
    documents.set(id, entry);
    return function cleanup() {
      documents.delete(id);
    };
  }

  function registerElement({ id, type }: DragRegistryKey, entry: HTMLElement): CleanupFn {
    if (type === "document") {
      return registerDocument({ id, entry });
    } else {
      return registerGroup({ id, entry });
    }
  }

  function retrieveElement({ id, type }: DragRegistryKey): HTMLElement | undefined {
    return type === "document" ? documents.get(id) : groups.get(id);
  }

  return { instanceId: Symbol("instance-id"), registerElement, retrieveElement };
}

function animateFlash(e: HTMLElement) {
  const fromBg = "var(--color-blue-50)";
  const toBg = getComputedStyle(e).backgroundColor;
  e.animate([{ backgroundColor: fromBg }, { backgroundColor: toBg }], {
    duration: 700,
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
    iterations: 1,
  });
}

export function triggerPostMoveFlash(element: HTMLElement, cssSelector: string) {
  const children = Array.from(element.querySelectorAll(cssSelector)).filter(
    (e): e is HTMLElement => e instanceof HTMLElement
  );
  animateFlash(element);
  children.forEach(animateFlash);
}
