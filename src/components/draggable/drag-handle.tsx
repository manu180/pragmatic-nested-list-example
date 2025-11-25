import type { ComponentPropsWithRef } from 'react';
import { GripVertical } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function DragHandle({
  ref,
  className,
}: ComponentPropsWithRef<'button'>) {
  return (
    <button
      ref={ref}
      className={twMerge(
        'drag-handle cursor-grab active:cursor-grabbing text-slate-500 bg-transparent p-1transition-colors',
        className
      )}
    >
      <GripVertical size={17} />
    </button>
  );
}
