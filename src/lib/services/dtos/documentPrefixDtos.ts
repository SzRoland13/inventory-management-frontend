import { DocumentType } from '@/lib/enums/documents';

export type DocumentPrefixDto = {
  id: number;
  documentType: DocumentType;
  prefix: string;
};

export type DocumentPrefixesUpdateRequest = {
  prefixes: DocumentPrefixDto[];
};

export type DocumentPrefixesResponse = {
  prefixes: DocumentPrefixDto[];
};
