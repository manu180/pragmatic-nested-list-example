import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { type Instruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item';
import type { CSSProperties, HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type Orientation = Instruction['axis'] | 'box';

type Side = Edge | 'all';

const getOrientation = (instruction: Instruction): Orientation => {
  if (instruction.operation === 'combine') {
    return 'box';
  }
  if (instruction.axis === 'horizontal') {
    return 'vertical';
  }
  return 'horizontal';
};

const getSide = (instruction: Instruction): Side => {
  if (instruction.operation === 'reorder-before') {
    return instruction.axis === 'horizontal' ? 'left' : 'top';
  }
  if (instruction.operation === 'reorder-after') {
    return instruction.axis === 'horizontal' ? 'right' : 'bottom';
  }
  return 'all';
};

const orientationStyles: Record<
  Orientation,
  HTMLAttributes<HTMLElement>['className']
> = {
  horizontal:
    'h-(--line-thickness) left-(--terminal-radius) right-0 before:left-(--negative-terminal-size)',
  vertical:
    'w-(--line-thickness) top-(--terminal-radius) bottom-0 before:top-(--negative-terminal-size)',
  box: 'w-full h-full top-0 left-0 before:hidden',
};

const sideStyles: Record<Side, HTMLAttributes<HTMLElement>['className']> = {
  top: 'top-(--line-offset) before:top-(--offset-terminal)',
  right: 'right-(--line-offset) before:right-(--offset-terminal)',
  bottom: 'bottom-(--line-offset) before:bottom-(--offset-terminal)',
  left: 'left-(--line-offset) before:left-(--offset-terminal)',
  all: 'w-full h-full top-0 left-0 before:hidden',
};

const strokeSize = 2;
const terminalSize = 8;
const offsetToAlignTerminalWithLine = (strokeSize - terminalSize) / 2;

type LineIndicatorVariableNames = '--line-thickness' | '--line-offset';
type TerminalIndicatorVariableNames =
  | '--terminal-size'
  | '--terminal-radius'
  | '--negative-terminal-size'
  | '--offset-terminal';

const getLineIndicatorVariables = (
  lineGap: CSSProperties['gap'] = '0px'
): Record<
  LineIndicatorVariableNames,
  HTMLAttributes<HTMLElement>['className']
> => {
  const lineOffset = `calc(-0.5 * (${lineGap} + ${strokeSize}px))`;
  return {
    '--line-thickness': `${strokeSize}px`,
    '--line-offset': `${lineOffset}`,
  };
};

const terminalIndicatorVariables: Record<
  TerminalIndicatorVariableNames,
  HTMLAttributes<HTMLElement>['className']
> = {
  '--terminal-size': `${terminalSize}px`,
  '--terminal-radius': `${terminalSize / 2}px`,
  '--negative-terminal-size': `-${terminalSize}px`,
  '--offset-terminal': `${offsetToAlignTerminalWithLine}px`,
};

/**
 * This is a tailwind port of `@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box`
 */
export function DropIndicator({
  instruction,
  lineGap = '0px',
}: {
  instruction: Instruction;
  lineGap?: CSSProperties['gap'];
}) {
  const orientation = getOrientation(instruction);
  const side = getSide(instruction);

  return (
    <div
      style={
        {
          ...terminalIndicatorVariables,
          ...getLineIndicatorVariables(lineGap),
        } as CSSProperties
      }
      className={twMerge(
        'absolute z-10 pointer-events-none box-border bg-blue-700',
        "before:border-blue-700 before:content-[''] before:w-(--terminal-size) before:h-(--terminal-size) before:absolute before:border-(length:--line-thickness) before:border-solid before:rounded-full", // terminal styles
        instruction.blocked && 'bg-amber-400 before:border-amber-400',
        // (side === "top" || side === "bottom") && "h-(--line-thickness) left-(--terminal-radius) right-0 before:left-(--negative-terminal-size)",
        // (side === "left" || side === "right") && "w-(--line-thickness) top-(--terminal-radius) bottom-0 before:top-(--negative-terminal-size)",
        // side === "top" && "top-(--line-offset) before:top-(--offset-terminal) before:left-(--negative-terminal-size)",
        // side === "right" && "right-(--line-offset) before:right-(--offset-terminal) before:top-(--negative-terminal-size)",
        // side === "bottom" && "bottom-(--line-offset) before:bottom-(--offset-terminal) before:left-(--negative-terminal-size)",
        // side === "left" && "left-(--line-offset) before:left-(--offset-terminal) before:top-(--negative-terminal-size)",
        instruction.operation === 'combine' &&
          'bg-transparent inset-0 border-2 border-blue-700 rounded-lg',
        orientationStyles[orientation],
        sideStyles[side]
      )}
    ></div>
  );
}
