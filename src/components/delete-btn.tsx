import { Trash2 } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export function DeleteBtn({ className, ...rest }: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={twMerge("cursor-pointer text-slate-500 bg-transparent transition-colors", className)}
      type="button"
      {...rest}
    >
      <Trash2 size={16} />
    </button>
  );
}
