import { Trash2 } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";
import { Badge } from "./badge";

export function DeleteBtn({ className, ...rest }: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={twMerge("cursor-pointer text-slate-500 bg-transparent transition-colors", className)}
      type="button"
      {...rest}
    >
      <Trash2 size={15} />
    </button>
  );
}

export function DeleteBtnWithBadge({ className, children, ...rest }: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={twMerge("relative cursor-pointer text-slate-500 bg-transparent transition-colors mr-1.5", className)}
      type="button"
      {...rest}
    >
      <Badge className="absolute bg-red-400 rounded-full text-2xs px-1 -right-2 -top-1.5">{children}</Badge>
      <Trash2 size={15} />
    </button>
  );
}
