import { useCallback, useMemo } from "react";
import type { HtmlElementKey } from "../../contexts/grid-view-context/grid-view-context";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";

function animateFlashHtmlElement(e: HTMLElement) {
  const fromBg = "var(--color-blue-50)";
  const toBg = getComputedStyle(e).backgroundColor;
  e.animate([{ backgroundColor: fromBg }, { backgroundColor: toBg }], {
    duration: 700,
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
    iterations: 1,
  });
}

function animateFlashHtmlElements(e: HTMLElement, cssSelector: string) {
  const children = Array.from(e.querySelectorAll(cssSelector)).filter(
    (e): e is HTMLElement => e instanceof HTMLElement
  );
  animateFlashHtmlElement(e);
  children.forEach(animateFlashHtmlElement);
}

export type RegisterHtmlElementFn = ({ id, type }: HtmlElementKey, e: HTMLElement) => CleanupFn;

type PostDragFlashState = {
  registerHtmlElement: RegisterHtmlElementFn;
  triggerPostMoveFlash: (key: HtmlElementKey, cssSelector: string) => void;
};

export function usePostDragFlash(): PostDragFlashState {
  const documents = useMemo(() => new Map<HtmlElementKey["id"], HTMLElement>(), []);
  const groups = useMemo(() => new Map<HtmlElementKey["id"], HTMLElement>(), []);

  const registerHtmlElement: RegisterHtmlElementFn = useCallback(
    ({ id, type }: HtmlElementKey, e: HTMLElement): CleanupFn => {
      if (type === "document") {
        // eslint-disable-next-line react-hooks/immutability
        documents.set(id, e);
        return function cleanup() {
          documents.delete(id);
        };
      }
      // eslint-disable-next-line react-hooks/immutability
      groups.set(id, e);
      return function cleanup() {
        groups.delete(id);
      };
    },
    [groups, documents]
  );

  const retrieveHtmlElement = useCallback(
    ({ id, type }: HtmlElementKey): HTMLElement | undefined => {
      return type === "document" ? documents.get(id) : groups.get(id);
    },
    [groups, documents]
  );

  const triggerPostMoveFlash = useCallback(
    (key: HtmlElementKey, cssSelector: string) => {
      const e = retrieveHtmlElement(key);
      if (!e) return;
      animateFlashHtmlElements(e, cssSelector);
    },
    [retrieveHtmlElement]
  );

  return { registerHtmlElement, triggerPostMoveFlash };
}
