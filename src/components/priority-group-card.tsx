import { useRef, useEffect, useState } from "react";
import type { Group } from "../types/data";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { type DropTargetRecord } from "@atlaskit/pragmatic-drag-and-drop/types";
import {
  type ElementDropTargetEventBasePayload,
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { DropIndicator } from "./draggable/drop-indicator";
import DocumentCard from "./document-card";
import { twMerge } from "tailwind-merge";
import {
  type Instruction,
  attachInstruction,
  extractInstruction,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { createPortal } from "react-dom";
import { isDocumentElement, isGroupElement, type DraggableState, type GroupElement } from "../types/draggable";
import { DragHandle } from "./draggable/drag-handle";
import { DragPreview } from "./draggable/drag-preview";

interface PriorityGroupProps {
  isFirst: boolean;
  isLast: boolean;
  group: Group;
  value: number;
}

type DroppableState = {
  isOver: boolean;
  instruction: Instruction | null;
};

const PriorityGroupCard = ({ isFirst, isLast, group, value }: PriorityGroupProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggableState, setDraggableState] = useState<DraggableState>({
    type: "idle",
  });
  const [droppableState, setDroppableState] = useState<DroppableState>({
    isOver: false,
    instruction: null,
  });
  //const [instruction, setInstruction] = useState<Instruction | null>(null);
  //console.log(`Rendering PriorityGroupCard ${groupIndex} - ${state.type}`);
  useEffect(() => {
    if (!ref.current || !dragHandleRef.current || !containerRef.current) return;
    const element = ref.current;
    const dragHandle = dragHandleRef.current;
    const container = containerRef.current;
    const data: GroupElement = { type: "group", isFirst, isLast, id: group.id };
    function handleGroupDrop(dragData: GroupElement, self: DropTargetRecord, dropTargets: DropTargetRecord[]) {
      if (isGroupElement(self.data) && self.data.id === dragData.id) {
        setDroppableState({ isOver: false, instruction: null });
        return;
      }
      const groupTargets = dropTargets.filter((x) => isGroupElement(x.data));
      if (groupTargets[0].element !== element) {
        setDroppableState({ isOver: false, instruction: null });
        return;
      }
      const instruction = extractInstruction(self.data);
      setDroppableState({ isOver: false, instruction });
    }
    function handleDocumentDrop(self: DropTargetRecord, dropTargets: DropTargetRecord[]) {
      // hovering over document i.e. reorder documents
      if (dropTargets[0].element !== element) {
        setDroppableState({ isOver: true, instruction: null });
        return;
      }
      // hovering over group only i.e. move into new group
      const instruction = extractInstruction(self.data);
      setDroppableState({ isOver: false, instruction });
    }
    function onChange({ source, self, location }: ElementDropTargetEventBasePayload) {
      if (isGroupElement(source.data)) {
        handleGroupDrop(source.data, self, location.current.dropTargets);
        return;
      }
      if (isDocumentElement(source.data)) {
        handleDocumentDrop(self, location.current.dropTargets);
        return;
      }
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
              setDraggableState({ type: "preview", container });
              return () => setDraggableState({ type: "is-dragging" });
            },
          });
        },
        onDragStart() {
          setDraggableState({ type: "is-dragging" });
        },
        onDrop() {
          setDraggableState({ type: "idle" });
        },
      }),
      dropTargetForElements({
        element,
        // canDrop({source}){
        //   return true;
        // },
        getIsSticky: () => true,
        getData({ input, source }) {
          if (isGroupElement(source.data) || isDocumentElement(source.data)) {
            return attachInstruction(data, {
              element,
              input,
              operations: {
                "reorder-before": "available",
                "reorder-after": "available",
                combine: "not-available",
              },
            });
          }
          // unknown source type
          return attachInstruction(data, {
            element,
            input,
            operations: {
              "reorder-before": "not-available",
              "reorder-after": "not-available",
              combine: "not-available",
            },
          });
        },
        onDragEnter: onChange,
        onDrag: onChange,
        onDragLeave() {
          setDroppableState({ isOver: false, instruction: null });
        },
        onDrop() {
          setDroppableState({ isOver: false, instruction: null });
        },
      }),
      dropTargetForElements({
        element: container,
        // stickyness set to false is the reason to have this droppable!
        getIsSticky: () => false,
      })
    );
  }, [group.id, isFirst, isLast, droppableState.isOver]);

  return (
    <>
      <div
        ref={ref}
        className={twMerge(
          "relative col-span-full grid grid-cols-subgrid",
          draggableState.type === "is-dragging" && " opacity-40",
          droppableState.isOver && "ring-2 ring-offset-4 rounded ring-blue-700/70"
        )}
      >
        <div
          className={twMerge(
            "peer text-slate-600 font-medium text-sm px-3 py-1.5 bg-slate-100 border-t-slate-200 border-t border-l-blue-500/50 rounded-l-sm border-l-4"
          )}
        >
          {value}
        </div>
        <DragHandle
          ref={dragHandleRef}
          className="absolute -left-3 top-1 invisible peer-hover:visible hover:visible hover:bg-blue-500 text-white hover:text-white p-1 rounded shadow bg-blue-500/70"
        />
        {group.documents.length > 0 && (
          <div ref={containerRef} className="ml-1.5 grid grid-cols-subgrid col-start-2 col-span-full  gap-y-1.5">
            {group.documents.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                groupId={group.id}
                isFirst={index === 0}
                isLast={index === group.documents.length - 1}
                document={doc}
              />
            ))}
          </div>
        )}
        {droppableState.instruction && <DropIndicator instruction={droppableState.instruction} lineGap="6px" />}
      </div>

      {draggableState.type === "preview" &&
        createPortal(
          <DragPreview className="bg-blue-700 text-white text-sm" value={`Priority ${value}`} />,
          draggableState.container
        )}
    </>
  );
};

export default PriorityGroupCard;
