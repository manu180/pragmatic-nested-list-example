import { createContext } from "react";
import type { DocumentEntry, FileEntry, GroupEntry } from "../../types/grid-entry";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";

export type HtmlElementKey = Pick<GroupEntry | DocumentEntry, "id" | "type">;

export type GridViewContextType = {
  remove: (element: GroupEntry | DocumentEntry | FileEntry) => void;
  //reorder: (args: ?) => void;
  registerHtmlElement: (key: HtmlElementKey, elem: HTMLElement) => CleanupFn;
};

export const GridViewContext = createContext<GridViewContextType | null>(null);
