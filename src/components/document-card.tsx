import { useRef, useEffect, useState } from "react";
import type { Document } from "../types/data";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
  type ElementDropTargetEventBasePayload,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { DragHandle } from "./draggable/drag-handle";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { isDocumentElement, type DocumentElement, type DraggableState } from "../types/draggable";
import { twMerge } from "tailwind-merge";
import { createPortal } from "react-dom";
import { DragPreview } from "./draggable/drag-preview";
import {
  type Instruction,
  attachInstruction,
  extractInstruction,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { DropIndicator } from "./draggable/drop-indicator";

interface DocumentCardProps {
  groupId: string;
  isFirst: boolean;
  isLast: boolean;
  document: Document;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, groupId, isFirst, isLast }) => {
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

  useEffect(() => {
    if (!ref.current || !dragHandleRef.current) return;
    const element = ref.current;
    const dragHandle = dragHandleRef.current;
    const data: DocumentElement = {
      type: "document",
      groupId,
      id: document.id,
      isFirst,
      isLast,
    };
    function onChange({ source, self, location }: ElementDropTargetEventBasePayload) {
      if (!isDocumentElement(source.data) || !isDocumentElement(self.data)) {
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
        getInitialData: () => data,
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
        canDrop: ({ source }) => isDocumentElement(source.data),
        getIsSticky: () => true,
        // canDrop({ source }) {
        //   return isPriorityDragData(source.data) && source.data.id === data.id;
        // },
        getData({ input }) {
          return attachInstruction(data, {
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
  }, [groupId, isFirst, isLast, document.id]);

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
          className="peer text-slate-600 font-medium text-sm px-3 py-1.5 bg-slate-100 border-t-slate-200 border-t border-l-teal-500/40 border-l-4"
        >
          {document.name}
        </div>
        <DragHandle
          ref={dragHandleRef}
          className="absolute -left-3 top-1 invisible peer-hover:visible hover:visible hover:bg-teal-500 text-white hover:text-white p-1 rounded shadow bg-teal-400/70"
        />
        {document.files.length > 0 && (
          <div className="grid grid-cols-subgrid col-start-2 col-span-full border-t-slate-200 border-t">
            {document.files.map((file) => (
              <div key={file.id} className="grid grid-cols-subgrid col-span-full border-slate-100 border-b py-1.5 text-sm text-gray-600">
                <div className="pl-2">{file.filename}</div>
                <div className="pl-2">{file.type}</div>
                <div className="pl-2">{file.category}</div>
                <div className="pl-2">{file.size}</div>
              </div>
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

export default DocumentCard;
