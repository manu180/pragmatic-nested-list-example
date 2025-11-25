import type { ComponentPropsWithoutRef } from 'react';
import { twMerge } from 'tailwind-merge';

export function DragPreview({
  value,
  className,
}: ComponentPropsWithoutRef<'button'> & { value: string }) {
  return (
    <div className={twMerge('border-solid rounded p-1.5 bg-white', className)}>
      {value}
    </div>
  );
}
