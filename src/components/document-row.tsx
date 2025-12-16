import { useRef, useEffect, useState, useMemo } from "react";
import type { Document } from "../types/data";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
  type ElementDropTargetEventBasePayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { DragHandleBtn } from "./draggable/drag-handle-btn";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { isDocumentEntry, type DocumentEntry } from "../types/grid-entry";
import { twMerge } from "tailwind-merge";
import { createPortal } from "react-dom";
import { DragPreview } from "./draggable/drag-preview";
import {
  type Instruction,
  attachInstruction,
  extractInstruction,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { DropIndicator } from "./draggable/drop-indicator";
import type { DraggableState } from "../types/draggable-state";
import { useGridView } from "../contexts/grid-view-context/use-grid-view";
import { DeleteBtn } from "./delete-btn";
import FileRow from "./file-row";

interface DocumentRowProps {
  groupId: string;
  isFirst: boolean;
  isLast: boolean;
  document: Document;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ document, groupId, isFirst, isLast }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<DraggableState>({
    type: "idle",
  });
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const moveInBetween =
    instruction &&
    !(isFirst && instruction.operation == "reorder-before") &&
    !(isLast && instruction.operation == "reorder-after");
  const entry = useMemo<DocumentEntry>(
    () => ({
      type: "document",
      groupId,
      id: document.id,
      isFirst,
      isLast,
    }),
    [groupId, document.id, isFirst, isLast]
  );
  const { registerHtmlElement, remove } = useGridView();
  useEffect(() => {
    if (!ref.current || !dragHandleRef.current) return;
    const element = ref.current;
    const dragHandle = dragHandleRef.current;
    registerHtmlElement({ id: entry.id, type: "document" }, element);
    function onChange({ source, self, location }: ElementDropTargetEventBasePayload) {
      if (!isDocumentEntry(source.data) || !isDocumentEntry(self.data)) {
        return;
      }
      if (self.data.id === source.data.id) {
        return;
      }
      const innerMost = location.current.dropTargets[0];
      if (innerMost.element !== element) {
        setInstruction(null);
        return;
      }
      const instruction = extractInstruction(self.data);
      setInstruction(instruction);
    }
    return combine(
      draggable({
        element: dragHandle, // enables text selection BUT beware it gets assigned to self.element
        getInitialData: () => entry,
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: "16px",
              y: "8px",
            }),
            render({ container }) {
              setState({ type: "preview", container });
              return () => setState({ type: "is-dragging" });
            },
          });
        },
        onDragStart() {
          setState({ type: "is-dragging" });
        },
        onDrop() {
          setState({ type: "idle" });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => isDocumentEntry(source.data),
        getIsSticky: () => true,
        // canDrop({ source }) {
        //   return isPriorityDragData(source.data) && source.data.id === data.id;
        // },
        getData({ input }) {
          return attachInstruction(entry, {
            element,
            input,
            operations: {
              "reorder-before": "available",
              "reorder-after": "available",
              combine: "not-available",
            },
          });
        },
        onDragEnter: onChange,
        onDrag: onChange,
        onDragLeave() {
          setInstruction(null);
        },
        onDrop() {
          setInstruction(null);
        },
      })
    );
  }, [entry, registerHtmlElement]);

  return (
    <>
      <div
        ref={ref}
        className={twMerge(
          "relative col-span-full grid grid-cols-subgrid",
          state.type === "is-dragging" && "opacity-40"
        )}
      >
        <div className="peer text-slate-600 font-medium text-sm pl-3 pr-2 py-1.5 bg-slate-100 border-t-slate-200 border-t border-l-teal-500/40 border-l-4">
          <div className="flex gap-3 items-center justify-between">
            <span className="whitespace-nowrap">{document.name}</span>
            <div className="flex gap-1.5 items-center">
              <span className="rounded-sm px-1.5 bg-slate-400/50 text-xs text-white font-medium">
                {document.files?.length}
              </span>
              <DeleteBtn
                onClick={() => {
                  remove(entry);
                }}
              />
            </div>
          </div>
        </div>
        <DragHandleBtn
          ref={dragHandleRef}
          className="absolute -left-2 top-1.5 py-1 px-0.5 invisible peer-hover:visible hover:visible hover:bg-teal-500 text-white hover:text-white rounded shadow bg-teal-400/70"
        />
        {document.files.length > 0 && (
          <div className="grid grid-cols-subgrid col-start-2 col-span-full border-t-slate-200 border-t">
            {document.files.map((file) => (
              <FileRow key={file.id} file={file} groupId={groupId} documentId={document.id} />
            ))}
          </div>
        )}
        {instruction && (
          <DropIndicator instruction={instruction} color="emerald" lineGap={moveInBetween ? "6px" : undefined} />
        )}
      </div>
      {state.type === "preview" &&
        createPortal(
          <DragPreview className="bg-teal-500 text-white text-sm" value={`${document.name}`} />,
          state.container
        )}
    </>
  );
};

export default DocumentRow;
