import { useEffect, useRef, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { isDocumentElement, isGroupElement, type DocumentElement, type GroupElement } from "../types/draggable";
import { reorderWithInstruction, type ReorderInstruction } from "../util/draggable-util";
import { ListOrdered } from "lucide-react";
import PriorityGroupCard from "./priority-group-card";
import type { Group } from "../types/data";
import { createGroup } from "../data/data";
import { createRegistry, triggerPostMoveFlash } from "./draggable/drag-registry";
import { DragRegistryContext } from "./draggable/drag-registry-context";

type ListState = {
  groups: Group[];
  lastMovedElement: GroupElement | DocumentElement | null;
};

export default function List({ items }: { items: Group[] }) {
  const [state, setState] = useState<ListState>({
    groups: items,
    lastMovedElement: null,
  });
  const [registry] = useState(createRegistry);
  useEffect(() => {
    if (!state.lastMovedElement) return;
    const elem = registry.retrieveElement({ id: state.lastMovedElement.id, type: state.lastMovedElement.type });
    if (!elem) return;
    triggerPostMoveFlash(elem, "div.peer");
  });
  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const targetElem = location.current.dropTargets.filter(
          (t) => isGroupElement(t.data) || isDocumentElement(t.data)
        )[0].data;
        const sourceElem = source.data;
        const instruction = extractInstruction(targetElem);
        if (!instruction || instruction.operation === "combine") {
          return;
        }
        // group over group (reorder)
        if (isGroupElement(sourceElem) && isGroupElement(targetElem)) {
          setState({
            groups: reorderGroups(state.groups, sourceElem.id, targetElem.id, instruction).filter(
              (g) => g.documents.length > 0
            ),
            lastMovedElement: sourceElem,
          });
          return;
        }
        // document over document (reorder)
        if (isDocumentElement(sourceElem) && isDocumentElement(targetElem)) {
          setState({
            groups: reorderDocuments(state.groups, sourceElem, targetElem, instruction).filter(
              (g) => g.documents.length > 0
            ),
            lastMovedElement: sourceElem,
          });
          return;
        }
        // document over group (move to new group)
        if (isDocumentElement(sourceElem) && isGroupElement(targetElem)) {
          setState({
            groups: moveDocumentToNewGroup(state.groups, sourceElem, targetElem.id, instruction).filter(
              (g) => g.documents.length > 0
            ),
            lastMovedElement: sourceElem,
          });
          return;
        }
      },
    });
  }, [state, registry]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <DragRegistryContext.Provider value={registry}>
      <div ref={ref} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-full grid grid-cols-subgrid text-gray-500 font-medium">
          <div className="flex items-center gap-2 py-2 px-3">
            <ListOrdered size={20} />
            <span>Priority</span>
          </div>
          <div className="py-2 px-3 ml-1.5">Document</div>
          <div className="p-2">File</div>
          <div className="p-2">Type</div>
          <div className="p-2">Category</div>
          <div className="p-2">Size</div>
        </div>
        <div className="grid grid-cols-subgrid col-span-full gap-y-1.5">
          {state.groups.map((p, idx) => (
            <PriorityGroupCard
              key={p.id}
              isFirst={idx === 0}
              isLast={idx === state.groups.length - 1}
              group={p}
              value={idx + 1}
            />
          ))}
        </div>
      </div>
    </DragRegistryContext.Provider>
  );
}

function reorderGroups(
  groups: Group[],
  sourceGroupId: Group["id"],
  targetGroupId: Group["id"],
  instruction: ReorderInstruction
): Group[] {
  const indexOfSource = groups.findIndex((p) => p.id === sourceGroupId);
  const indexOfTarget = groups.findIndex((p) => p.id === targetGroupId);
  if (indexOfTarget === -1 || indexOfSource === -1) {
    return groups;
  }
  return reorderWithInstruction({
    list: groups,
    startIndex: indexOfSource,
    indexOfTarget,
    instruction,
  });
}

function reorderDocuments(
  groups: Group[],
  source: DocumentElement,
  target: DocumentElement,
  instruction: ReorderInstruction
): Group[] {
  const sourceGroupIndex = groups.findIndex((p) => p.id === source.groupId);
  const targetGroupIndex = groups.findIndex((p) => p.id === target.groupId);

  const sourceDocumentIndex = groups[sourceGroupIndex].documents.findIndex((p) => p.id === source.id);
  const targetDocumentIndex = groups[targetGroupIndex].documents.findIndex((p) => p.id === target.id);
  if (sourceGroupIndex === -1 || targetGroupIndex === -1 || sourceDocumentIndex === -1 || targetDocumentIndex === -1) {
    return groups;
  }

  // source & target group is same
  if (sourceGroupIndex === targetGroupIndex) {
    const documents = reorderWithInstruction({
      list: groups[sourceGroupIndex].documents,
      startIndex: sourceDocumentIndex,
      indexOfTarget: targetDocumentIndex,
      instruction,
    });
    const result = Array.from(groups);
    result[sourceGroupIndex] = { ...groups[sourceGroupIndex], documents };
    return result;
  }

  const sourceGroup = Object.assign({}, groups[sourceGroupIndex]);
  const targetGroup = Object.assign({}, groups[targetGroupIndex]);

  const [draggedDocument] = sourceGroup.documents.splice(sourceDocumentIndex, 1);
  const isGoingAfter = instruction.operation === "reorder-after";
  if (isGoingAfter && targetDocumentIndex >= targetGroup.documents.length - 1) {
    targetGroup.documents.push(draggedDocument);
  } else {
    const documentIndex = isGoingAfter ? targetDocumentIndex + 1 : targetDocumentIndex;
    targetGroup.documents.splice(documentIndex, 0, draggedDocument);
  }
  const newGroups = ([] as Group[]).concat(groups);
  newGroups[sourceGroupIndex] = sourceGroup;
  newGroups[targetGroupIndex] = targetGroup;
  return newGroups;
}

let newGroupCounter = 0;

function moveDocumentToNewGroup(
  groups: Group[],
  source: DocumentElement,
  targetGroupId: Group["id"],
  instruction: ReorderInstruction
): Group[] {
  const sourceGroupIndex = groups.findIndex((g) => g.id === source.groupId);
  const sourceDocumentIndex = groups[sourceGroupIndex].documents.findIndex((d) => d.id === source.id);
  const targetGroupIndex = groups.findIndex((g) => g.id === targetGroupId);

  const isGoingAfter = instruction.operation === "reorder-after";
  const groupsBefore = isGoingAfter
    ? [...groups.slice(0, targetGroupIndex + 1)]
    : [...groups.slice(0, targetGroupIndex)];
  const groupsAfter = isGoingAfter ? [...groups.slice(targetGroupIndex + 1)] : [...groups.slice(targetGroupIndex)];

  const sourceGroup =
    sourceGroupIndex < groupsBefore.length
      ? groupsBefore[sourceGroupIndex]
      : groupsAfter[sourceGroupIndex - groupsBefore.length];

  const [document] = sourceGroup.documents.splice(sourceDocumentIndex, 1);
  const newGroup = createGroup(`New Group ${++newGroupCounter}`, document ? [document] : []);
  return ([] as Group[]).concat(groupsBefore, newGroup, ...groupsAfter);
}
