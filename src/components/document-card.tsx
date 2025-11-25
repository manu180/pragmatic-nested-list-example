import { useRef, useEffect, useState } from 'react';
import type { Document } from '../types/data';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
  type ElementDropTargetEventBasePayload,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { DragHandle } from './draggable/drag-handle';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import {
  isDocumentElement,
  type DocumentElement,
  type DraggableState,
} from '../types/draggable';
import { twMerge } from 'tailwind-merge';
import { createPortal } from 'react-dom';
import { DragPreview } from './draggable/drag-preview';
import {
  type Instruction,
  attachInstruction,
  extractInstruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item';
import { DropIndicator } from './draggable/drop-indicator';

interface DocumentCardProps {
  groupId: string;
  isFirst: boolean;
  isLast: boolean;
  document: Document;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  groupId,
  isFirst,
  isLast,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<DraggableState>({
    type: 'idle',
  });
  const [instruction, setInstruction] = useState<Instruction | null>(null);

  useEffect(() => {
    if (!ref.current || !dragHandleRef.current) return;
    const element = ref.current;
    const dragHandle = dragHandleRef.current;
    const data: DocumentElement = {
      type: 'document',
      groupId,
      id: document.id,
      isFirst,
      isLast,
    };
    function onChange({
      source,
      self,
      location,
    }: ElementDropTargetEventBasePayload) {
      if (!isDocumentElement(source.data) || !isDocumentElement(self.data)) {
        return;
      }
      if (self.data.id === source.data.id) {
        return;
      }
      const innerMost = location.current.dropTargets[0];
      if (innerMost.element !== element) {
        setInstruction(null);
        return;
      }
      const instruction = extractInstruction(self.data);
      setInstruction(instruction);
    }
    return combine(
      draggable({
        element: dragHandle, // enables text selection BUT beware it gets assigned to self.element
        getInitialData: () => data,
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '8px',
            }),
            render({ container }) {
              setState({ type: 'preview', container });
              return () => setState({ type: 'is-dragging' });
            },
          });
        },
        onDragStart() {
          setState({ type: 'is-dragging' });
        },
        onDrop() {
          setState({ type: 'idle' });
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => isDocumentElement(source.data),
        getIsSticky: () => true,
        // canDrop({ source }) {
        //   return isPriorityDragData(source.data) && source.data.id === data.id;
        // },
        getData({ input }) {
          return attachInstruction(data, {
            element,
            input,
            operations: {
              'reorder-before': 'available',
              'reorder-after': 'available',
              combine: 'not-available',
            },
          });
        },
        onDragEnter: onChange,
        onDrag: onChange,
        onDragLeave() {
          setInstruction(null);
        },
        onDrop() {
          setInstruction(null);
        },
      })
    );
  }, [groupId, isFirst, isLast, document.id]);

  return (
    <>
      <div className="relative">
        <div
          ref={ref}
          className={twMerge(
            'flex flex-col gap-2 bg-white rounded-md p-1.5 shadow/10',
            state.type === 'is-dragging' && 'bg-slate-100 opacity-40'
          )}
        >
          <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
            <DragHandle
              ref={dragHandleRef}
              className="hover:bg-slate-200 hover:text-slate-700 rounded px-0.5 py-1"
            />
            <h2 className="text-sm font-medium text-slate-700">
              {document.name}
            </h2>
            {document.files.length > 0 && (
              <div className="col-start-2 grid gap-1">
                {document.files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-gray-50 px-3 py-1.5 rounded text-sm text-gray-600"
                  >
                    <span className="font-mono">{file.filename}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {instruction && (
          <DropIndicator instruction={instruction} lineGap="8px" />
        )}
      </div>
      {state.type === 'preview' &&
        createPortal(
          <DragPreview
            className="bg-slate-400 text-white text-sm"
            value={`${document.name}`}
          />,
          state.container
        )}
    </>
  );
};

export default DocumentCard;
