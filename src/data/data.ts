import type { Group } from '../types/data';
import type { Document } from '../types/data';
import { v4 as uuidv4 } from 'uuid';

const data: Group[] = [
  {
    id: 'group-0',
    name: 'Group 1',
    documents: [
      {
        id: 'Doc1',
        name: 'Document 1',
        files: [
          {
            id: 'File1',
            filename: 'file1.txt',
          },
          {
            id: 'File2',
            filename: 'file2.txt',
          },
        ],
      },
      {
        id: 'Doc2',
        name: 'Document 2',
        files: [
          {
            id: 'File3',
            filename: 'file3.txt',
          },
        ],
      },
    ],
  },
  {
    id: 'group-1',
    name: 'Group 2',
    documents: [
      {
        id: 'Doc3',
        name: 'Document 3',
        files: [
          {
            id: 'File4',
            filename: 'file4.txt',
          },
          {
            id: 'File5',
            filename: 'file5.txt',
          },
          {
            id: 'File6',
            filename: 'file6.txt',
          },
        ],
      },
      {
        id: 'Doc4',
        name: 'Document 4',
        files: [
          {
            id: 'File7',
            filename: 'file7.txt',
          },
        ],
      },
    ],
  },
  {
    id: 'group-2',
    name: 'Group 3',
    documents: [
      {
        id: 'Doc5',
        name: 'Document 5',
        files: [
          {
            id: 'File8',
            filename: 'file8.txt',
          },
          {
            id: 'File9',
            filename: 'file9.txt',
          },
          {
            id: 'File10',
            filename: 'file10.txt',
          },
          {
            id: 'File11',
            filename: 'file11.txt',
          },
        ],
      },
    ],
  },
  {
    id: 'group-3',
    name: 'Group 4',
    documents: [
      {
        id: 'Doc6',
        name: 'Document 6',
        files: [
          {
            id: 'File12',
            filename: 'file12.txt',
          },
        ],
      },
    ],
  },
  {
    id: 'group-4',
    name: 'Group 5',
    documents: [
      {
        id: 'Doc7',
        name: 'Document 7',
        files: [
          {
            id: 'File13',
            filename: 'file13.txt',
          },
        ],
      },
      {
        id: 'Doc8',
        name: 'Document 8',
        files: [
          {
            id: 'File14',
            filename: 'file14.txt',
          },
          {
            id: 'File15',
            filename: 'file15.txt',
          },
          {
            id: 'File16',
            filename: 'file16.txt',
          },
        ],
      },
      {
        id: 'Doc9',
        name: 'Document 9',
        files: [
          {
            id: 'File17',
            filename: 'file17.txt',
          },
        ],
      },
    ],
  },
];

export function getData(): Group[] {
  return data;
}

export function createGroup(
  name: Group['name'],
  documents?: Document[]
): Group {
  return {
    id: uuidv4(),
    name,
    documents: documents || [],
  } satisfies Group;
}
