import { getData } from "./data/data";
import GridView from "./components/grid-view";
import { useState } from "react";
import type { Group } from "./types/data";
import { isDocumentEntry, isFileEntry, type DocumentEntry, type FileEntry, type GroupEntry } from "./types/grid-entry";

function App() {
  const [groups, setGroups] = useState<Group[]>(getData());

  const removeFile = (e: FileEntry) => {
    const newGroups = [...groups];
    const groupIndex = newGroups.findIndex((group) => group.id === e.groupId);
    if (groupIndex === -1) {
      return;
    }
    const group = newGroups[groupIndex];
    const documentIndex = group.documents.findIndex((doc) => doc.id === e.documentId);
    if (documentIndex === -1) {
      return;
    }
    const newDocuments = [...group.documents];
    const document = newDocuments[documentIndex];
    const fileIndex = document.files.findIndex((file) => file.id === e.id);
    if (fileIndex === -1) {
      return;
    }
    document.files = [...document.files];
    document.files.splice(fileIndex, 1);
    group.documents = newDocuments.filter((d) => d.files?.length > 0);
    setGroups(newGroups.filter((g) => g.documents?.length > 0));
  };

  const removeDocument = (e: DocumentEntry) => {
    const newGroups = [...groups];
    const groupIndex = newGroups.findIndex((group) => group.id === e.groupId);
    if (groupIndex === -1) {
      return;
    }
    const group = newGroups[groupIndex];
    const documentIndex = group.documents.findIndex((doc) => doc.id === e.id);
    if (documentIndex === -1) {
      return;
    }
    group.documents = [...group.documents];
    group.documents.splice(documentIndex, 1);
    setGroups(newGroups.filter((g) => g.documents?.length > 0));
  };

  const removeGroup = (e: GroupEntry) => {
    const newGroups = [...groups];
    const index = newGroups.findIndex((group) => group.id === e.id);
    if (index === -1) {
      return;
    }
    newGroups.splice(index, 1);
    setGroups(newGroups);
  };

  const handleDeleteEntry = (e: GroupEntry | DocumentEntry | FileEntry) => {
    if (isFileEntry(e)) {
      removeFile(e);
      return;
    }
    if (isDocumentEntry(e)) {
      removeDocument(e);
      return;
    }
    removeGroup(e);
  };
  return (
    <div className="p-8">
      <GridView
        groups={groups}
        onChangeGroups={(newData) => setGroups([...newData])}
        onRemoveEntry={handleDeleteEntry}
      />
    </div>
  );
}

export default App;
