//import type { Group } from "./data";

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

type ElementId = {
  id: string;
};

export type ElementPosition = {
  isFirst: boolean;
  isLast: boolean;
};

export type GroupElement = ElementId &
  ElementPosition & {
    type: "group";
  };

export type DocumentElement = ElementId &
  ElementPosition & {
    groupId: GroupElement["id"];
    type: "document";
  };

function isElementId(value: unknown): value is ElementId {
  return typeof value === "object" && value !== null && "id" in value && typeof (value as ElementId).id === "string";
}

function isElementPosition(value: unknown): value is ElementPosition {
  return (
    typeof value === "object" &&
    value !== null &&
    "isFirst" in value &&
    typeof (value as ElementPosition).isFirst === "boolean" &&
    "isLast" in value &&
    typeof (value as ElementPosition).isLast === "boolean"
  );
}

export function isGroupElement(value: unknown): value is GroupElement {
  return (
    isElementId(value) &&
    isElementPosition(value) &&
    "type" in value &&
    typeof (value as GroupElement).type === "string" &&
    (value as GroupElement).type === "group"
  );
}

export function isDocumentElement(value: unknown): value is DocumentElement {
  return (
    isElementId(value) &&
    isElementPosition(value) &&
    "type" in value &&
    typeof (value as DocumentElement).type === "string" &&
    (value as DocumentElement).type === "document" &&
    "groupId" in value &&
    typeof (value as DocumentElement).groupId === "string"
  );
}
