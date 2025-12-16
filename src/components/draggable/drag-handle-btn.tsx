import type { ComponentPropsWithRef } from "react";
import { GripVertical } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function DragHandleBtn({ ref, className, ...rest }: ComponentPropsWithRef<"button">) {
  return (
    <button
      ref={ref}
      className={twMerge(
        "drag-handle cursor-grab active:cursor-grabbing text-slate-500 bg-transparent transition-colors",
        className
      )}
      type="button"
      {...rest}
    >
      <GripVertical size={15} />
    </button>
  );
}
