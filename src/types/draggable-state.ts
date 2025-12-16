type DraggableIdle = {
  type: "idle";
};
type DraggablePreview = {
  type: "preview";
  container: HTMLElement;
};
type DraggableIsDragging = {
  type: "is-dragging";
};
export type DraggableState = DraggableIdle | DraggablePreview | DraggableIsDragging;

export type DraggableMetadata = {
  isFirst: boolean;
  isLast: boolean;
};
