import { useRef, useEffect, useState, useMemo } from "react";
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
import DocumentRow from "./document-row";
import { twMerge } from "tailwind-merge";
import {
  type Instruction,
  attachInstruction,
  extractInstruction,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { createPortal } from "react-dom";
import { isDocumentEntry, isGroupEntry, type GroupEntry } from "../types/grid-entry";
import { DragHandleBtn } from "./draggable/drag-handle-btn";
import { DragPreview } from "./draggable/drag-preview";
import type { DraggableMetadata, DraggableState } from "../types/draggable-state";
import { useGridView } from "../contexts/grid-view-context/use-grid-view";
import { DeleteBtnWithBadge } from "./delete-btn";

interface PriorityGroupRowProps {
  group: Group;
  value: number;
  position: DraggableMetadata;
}

type DroppableState = {
  isOver: boolean;
  instruction: Instruction | null;
};

const PriorityGroupRow = ({ group, value, position }: PriorityGroupRowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggableState, setDraggableState] = useState<DraggableState>({
    type: "idle",
  });
  const [droppableState, setDroppableState] = useState<DroppableState>({
    isOver: false,
    instruction: null,
  });
  const entry = useMemo<GroupEntry>(
    () => ({
      id: group.id,
      type: "group",
      isFirst: position.isFirst,
      isLast: position.isLast,
    }),
    [group, position]
  );
  const { registerHtmlElement, remove } = useGridView();
  useEffect(() => {
    if (!ref.current || !draggableRef.current || !containerRef.current) return;
    const element = ref.current;
    const draggableElem = draggableRef.current;
    const container = containerRef.current;
    registerHtmlElement({ id: entry.id, type: "group" }, element);
    function handleGroupDrop(dragData: GroupEntry, self: DropTargetRecord, dropTargets: DropTargetRecord[]) {
      if (isGroupEntry(self.data) && self.data.id === dragData.id) {
        setDroppableState({ isOver: false, instruction: null });
        return;
      }
      const groupTargets = dropTargets.filter((x) => isGroupEntry(x.data));
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
      if (isGroupEntry(source.data)) {
        handleGroupDrop(source.data, self, location.current.dropTargets);
        return;
      }
      if (isDocumentEntry(source.data)) {
        handleDocumentDrop(self, location.current.dropTargets);
        return;
      }
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
          if (isGroupEntry(source.data) || isDocumentEntry(source.data)) {
            return attachInstruction(entry, {
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
          return attachInstruction(entry, {
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
  }, [entry, droppableState.isOver, registerHtmlElement]);

  return (
    <>
      <div
        ref={ref}
        className={twMerge(
          "relative col-span-full grid grid-cols-subgrid",
          //"has-[div[draggable]:hover]:[&_div[draggable]]:bg-slate-200",
          draggableState.type === "is-dragging" && " opacity-40",
          droppableState.isOver && "ring-2 ring-offset-4 rounded-xs ring-blue-700"
        )}
      >
        <div
          ref={draggableRef}
          // add attribute data-drag-handle to button and here hover:[&_button[data-drag-handle]]:text-blue-500
          // OR
          // set group/priority here and use it on button with group-hover/priority:text-blue-500
          className={twMerge(
            // Layout and cursor states
            "peer/priority group/priority cursor-grab active:cursor-grabbing",
            // Typography and spacing
            "text-slate-800 font-medium text-sm p-1.5",
            // Background
            "bg-slate-100 hover:bg-slate-200",
            // Border
            "border-t-slate-200 border-t border-l-4 border-l-blue-500/50 hover:border-l-blue-500"
          )}
        >
          <div className="flex gap-3 items-center justify-between">
            <div className="flex items-center gap-1">
              <DragHandleBtn className="text-blue-500/50 group-hover/priority:text-blue-500" />
              {value}
            </div>
            <DeleteBtnWithBadge
              onClick={() => {
                remove(entry);
              }}
            >
              {group.documents.flatMap((d) => d.files).length}
            </DeleteBtnWithBadge>
          </div>
        </div>
        {group.documents.length > 0 && (
          <div
            ref={containerRef}
            className={twMerge(
              "ml-1.5 grid grid-cols-subgrid col-start-2 col-span-full gap-y-1.5",
              // When peer-priority is hovered, apply hover styles to all direct children divs of element with data-draggable-document attribute
              "peer-hover/priority:[&_div:has([data-draggable-document])>div]:bg-slate-200 peer-hover/priority:[&_div:has([data-draggable-document])>div]:border-b-slate-200"
            )}
          >
            {group.documents.map((doc, index) => (
              <DocumentRow
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

export default PriorityGroupRow;
