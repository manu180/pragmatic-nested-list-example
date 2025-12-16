type Id = {
  id: string;
};

function isId(value: unknown): value is Id {
  return typeof value === "object" && value !== null && "id" in value && typeof (value as Id).id === "string";
}

type Position = {
  isFirst: boolean;
  isLast: boolean;
};

function isPosition(value: unknown): value is Position {
  return (
    typeof value === "object" &&
    value !== null &&
    "isFirst" in value &&
    typeof (value as Position).isFirst === "boolean" &&
    "isLast" in value &&
    typeof (value as Position).isLast === "boolean"
  );
}

export type GroupEntry = Id &
  Position & {
    type: "group";
  };

export function isGroupEntry(value: unknown): value is GroupEntry {
  return (
    isId(value) &&
    isPosition(value) &&
    "type" in value &&
    typeof (value as GroupEntry).type === "string" &&
    (value as GroupEntry).type === "group"
  );
}

export type DocumentEntry = Id &
  Position & {
    type: "document";
    groupId: GroupEntry["id"];
  };

export function isDocumentEntry(value: unknown): value is DocumentEntry {
  return (
    isId(value) &&
    isPosition(value) &&
    "type" in value &&
    typeof (value as DocumentEntry).type === "string" &&
    (value as DocumentEntry).type === "document" &&
    "groupId" in value &&
    typeof (value as DocumentEntry).groupId === "string"
  );
}

export type FileEntry = Id &
  Pick<DocumentEntry, "groupId"> & {
    type: "file";
    documentId: DocumentEntry["id"];
  };

export function isFileEntry(value: unknown): value is FileEntry {
  return (
    isId(value) &&
    "type" in value &&
    typeof (value as FileEntry).type === "string" &&
    (value as FileEntry).type === "file" &&
    "groupId" in value &&
    typeof (value as FileEntry).groupId === "string" &&
    "documentId" in value &&
    typeof (value as FileEntry).groupId === "string"
  );
}
