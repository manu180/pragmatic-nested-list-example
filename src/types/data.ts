export interface File {
  id: string;
  filename: string;
}

export interface Document {
  id: string;
  name: string;
  files: File[];
}

export interface Group {
  id: string;
  name: string;
  documents: Document[];
}
