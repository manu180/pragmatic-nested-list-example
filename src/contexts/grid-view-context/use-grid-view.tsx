import { useContext } from "react";
import { GridViewContext, type GridViewContextType } from "./grid-view-context";

export function useGridView(): GridViewContextType {
  const value = useContext(GridViewContext);
  if (value === null) {
    throw new Error("useGridView must be used within a GridViewContext.Provider");
  }
  return value;
}
