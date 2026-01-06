import { useGridView } from "../contexts/grid-view-context/use-grid-view";
import type { File } from "../types/data";
import { DeleteBtn } from "./delete-btn";

interface FileRowProps {
  groupId: string;
  documentId: string;
  file: File;
}

const FileRow = ({ groupId, documentId, file }: FileRowProps) => {
  const { remove } = useGridView();
  return (
    <div
      key={file.id}
      className="grid grid-cols-subgrid col-span-full items-center not-last:border-slate-100 not-last:border-b py-1.5 text-sm text-gray-600"
    >
      <div className="px-2">{file.filename}</div>
      <div className="px-2">{file.type}</div>
      <div className="px-2">{file.category}</div>
      <div className="flex gap-1.5 px-2 items-center justify-between">
        {file.size}

        <DeleteBtn
          onClick={() => {
            remove({ type: "file", id: file.id, groupId, documentId });
          }}
        />
      </div>
    </div>
  );
};

export default FileRow;
