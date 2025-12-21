import type { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export function Badge({ className, children, ...rest }: ComponentPropsWithoutRef<"span">) {
  return (
    <span className={twMerge("rounded-sm px-1.5 bg-slate-400/50 text-xs text-white", className)} {...rest}>
      {children}
    </span>
  );
}
