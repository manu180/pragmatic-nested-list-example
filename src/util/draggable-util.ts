import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import type { Availability, Instruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
export type ReorderInstruction = Exclude<Instruction, { operation: "combine" }>;

function getReorderDestinationIndex({
  startIndex,
  instruction,
  indexOfTarget,
}: {
  startIndex: number;
  instruction: ReorderInstruction | null;
  indexOfTarget: number;
}): number {
  // invalid index's
  if (startIndex === -1 || indexOfTarget === -1) {
    return startIndex;
  }

  // if we are targeting the same index we don't need to do anything
  if (startIndex === indexOfTarget) {
    return startIndex;
  }

  if (instruction == null) {
    return indexOfTarget;
  }

  const isGoingAfter: boolean = instruction.operation === "reorder-after";

  const isMovingForward: boolean = startIndex < indexOfTarget;
  // moving forward
  if (isMovingForward) {
    return isGoingAfter ? indexOfTarget : indexOfTarget - 1;
  }
  // moving backwards
  return isGoingAfter ? indexOfTarget + 1 : indexOfTarget;
}

export function reorderWithInstruction<Value>({
  list,
  startIndex,
  instruction,
  indexOfTarget,
}: {
  list: Value[];
  instruction: ReorderInstruction | null;
  startIndex: number;
  indexOfTarget: number;
}): Value[] {
  return reorder({
    list,
    startIndex,
    finishIndex: getReorderDestinationIndex({
      instruction,
      startIndex,
      indexOfTarget,
    }),
  });
}

export type Operations = {
  [TKey in Instruction["operation"]]?: Availability;
};
