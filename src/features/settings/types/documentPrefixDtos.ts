import { DocumentType } from '@/features/documents/enums/documentEnums';

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
