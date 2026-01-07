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
import { DeleteBtnWithBadge } from "./delete-btn";
import FileRow from "./file-row";

interface DocumentRowProps {
  groupId: string;
  isFirst: boolean;
  isLast: boolean;
  document: Document;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ document, groupId, isFirst, isLast }) => {
  const ref = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
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
    if (!ref.current || !draggableRef.current) return;
    const element = ref.current;
    const draggableElem = draggableRef.current;
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
        element: draggableElem, // text selection is disabled within the entire element - use a drag handle if needed
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
        <div
          ref={draggableRef}
          data-draggable-document
          // add attribute data-drag-handle to button and here hover:[&_button[data-drag-handle]]:text-teal-500
          // OR
          // set group/document here and use it on button with group-hover/document:text-teal-500
          className={twMerge(
            // Layout and cursor states
            "peer/document group/document cursor-grab active:cursor-grabbing",
            // Typography and spacing
            "text-slate-800 font-medium text-sm p-1.5",
            // Background
            "bg-slate-100 hover:bg-slate-200",
            // Border
            "border-t border-t-slate-200 border-l-4 border-l-teal-500/40 hover:border-l-teal-500"
          )}
        >
          <div className="flex gap-3 items-center justify-between">
            <div className="flex items-center gap-1">
              <DragHandleBtn className="text-teal-500/40 group-hover/document:text-teal-500" />
              <span className="whitespace-nowrap">{document.name}</span>
            </div>
            <DeleteBtnWithBadge
              onClick={() => {
                remove(entry);
              }}
            >
              {document.files?.length}
            </DeleteBtnWithBadge>
          </div>
        </div>
        {document.files.length > 0 && (
          <div
            className={twMerge(
              "grid grid-cols-subgrid col-start-2 col-span-full",
              // Background
              "bg-white",
              // Border
              "border-t border-t-slate-200 border-b border-b-slate-100",
              // When peer-priority is hovered, apply hover styles
              "peer-hover/document:[&>div]:bg-slate-200 peer-hover/document:border-b-slate-200"
            )}
          >
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
