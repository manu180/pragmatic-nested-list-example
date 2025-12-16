import { useEffect, useRef } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import {
  isDocumentEntry,
  isGroupEntry,
  type DocumentEntry,
  type FileEntry,
  type GroupEntry,
} from "../types/grid-entry";
import { reorderWithInstruction, type ReorderInstruction } from "../util/draggable-util";
import { ListOrdered } from "lucide-react";
import PriorityGroupRow from "./priority-group-row";
import type { Group } from "../types/data";
import { createGroup } from "../data/data";
import { GridViewContext } from "../contexts/grid-view-context/grid-view-context";
import { usePostDragFlash } from "./draggable/use-post-drag-flash";
import { flushSync } from "react-dom";

type GridView = {
  groups: Group[];
  lastMovedEntry: GroupEntry | DocumentEntry | null;
};

export type UpdateGroupsHandler = (data: Group[]) => void;
export type RemoveEntryHandler = (e: GroupEntry | DocumentEntry | FileEntry) => void;

type GridViewProps = {
  groups: Group[];
  onChangeGroups: UpdateGroupsHandler;
  onRemoveEntry: RemoveEntryHandler;
};

export default function GridView({ groups, onChangeGroups, onRemoveEntry }: GridViewProps) {
  const { registerHtmlElement, triggerPostMoveFlash } = usePostDragFlash();
  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const targetElem = location.current.dropTargets.filter(
          (t) => isGroupEntry(t.data) || isDocumentEntry(t.data)
        )[0].data;
        const sourceElem = source.data;
        const instruction = extractInstruction(targetElem);
        if (!instruction || instruction.operation === "combine") {
          return;
        }
        // group over group (reorder)
        if (isGroupEntry(sourceElem) && isGroupEntry(targetElem)) {
          onChangeGroups(
            reorderGroups(groups, sourceElem.id, targetElem.id, instruction).filter((g) => g.documents.length > 0)
          );
          triggerPostMoveFlash(sourceElem, "div.peer");
          return;
        }
        // document over document (reorder)
        if (isDocumentEntry(sourceElem) && isDocumentEntry(targetElem)) {
          flushSync(() => {
            onChangeGroups(
              reorderDocuments(groups, sourceElem, targetElem, instruction).filter((g) => g.documents.length > 0)
            );
          });
          triggerPostMoveFlash(sourceElem, "div.peer");
          return;
        }
        // document over group (move to new group)
        if (isDocumentEntry(sourceElem) && isGroupEntry(targetElem)) {
          // flushSync triggers
          flushSync(() => {
            onChangeGroups(
              moveDocumentToNewGroup(groups, sourceElem, targetElem.id, instruction).filter(
                (g) => g.documents.length > 0
              )
            );
          });
          triggerPostMoveFlash(sourceElem, "div.peer");
          return;
        }
      },
    });
  }, [groups, onChangeGroups, triggerPostMoveFlash]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <GridViewContext.Provider value={{ registerHtmlElement, remove: onRemoveEntry }}>
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
          {groups.map((p, idx) => (
            <PriorityGroupRow
              key={p.id}
              position={{ isFirst: idx === 0, isLast: idx === groups.length - 1 }}
              group={p}
              value={idx + 1}
            />
          ))}
        </div>
      </div>
    </GridViewContext.Provider>
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
  source: DocumentEntry,
  target: DocumentEntry,
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
  source: DocumentEntry,
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
