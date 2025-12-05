export interface File {
  id: string;
  filename: string;
  type: string;
  category: string;
  size: number;
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
