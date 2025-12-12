import { createContext, useContext } from "react";

import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import type { GroupElement, DocumentElement } from "../../types/draggable";

export type DragRegistryKey = Pick<GroupElement | DocumentElement, "id" | "type">;
export type DragRegistryAddArgs = DragRegistryKey & { entry: HTMLElement };

export type DragRegistryContextValue = {
  registerElement: (key: DragRegistryKey, elem: HTMLElement) => CleanupFn;
  retrieveElement: (key: DragRegistryKey) => HTMLElement | undefined;
  instanceId: symbol;
};

export const DragRegistryContext = createContext<DragRegistryContextValue | null>(null);

export function useDragRegistryContext(): DragRegistryContextValue {
  const value = useContext(DragRegistryContext);
  if (value === null) {
    throw new Error("useDragRegistryContext must be used within a DragRegistryContext.Provider");
  }
  return value;
}
