import {
  DocumentAction,
  DocumentFileSource,
  DocumentFileStatus,
  DocumentQueueView,
  DocumentRelationKind,
  DocumentStatus,
  DocumentType,
} from '@/features/documents/enums/documentEnums';

export type OrderDocumentType = DocumentType.PURCHASE_ORDER | DocumentType.SALES_ORDER;
export type ReleaseOneDocumentType = OrderDocumentType | DocumentType.GOODS_RECEIPT | DocumentType.DELIVERY_NOTE;

export type RelatedDocument = {
  id: number;
  number: string;
  type: DocumentType;
  relationKind?: DocumentRelationKind;
};

export type DocumentLine = {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  unitName: string;
  unitId: number;
  orderedQuantity: number;
  fulfilledQuantity: number;
  operationQuantity?: number;
  remainingQuantity: number;
  billedQuantity?: number;
  returnableQuantity?: number;
  returnedQuantity?: number;
  inTransitQuantity?: number;
  expectedQuantity?: number;
  countedQuantity?: number;
  variance?: number;
  unitPrice?: number;
  sourceAllocations?: Array<{
    sourceDocumentId: number;
    sourceLineId: number;
    sourceDocumentNumber: string;
    quantity: number;
  }>;
};

export type DocumentTotals = {
  currencyCode: string;
  net: number;
  tax: number;
  gross: number;
  roundingAdjustment?: number;
};

export type DocumentFile = {
  id: number;
  fileName: string;
  contentType: string;
  source: DocumentFileSource;
  status?: DocumentFileStatus;
  errorMessage?: string;
  downloadUrl?: string;
  createdAt: string;
};

export type DocumentActivity = {
  id: number;
  description: string;
  actorName: string;
  occurredAt: string;
};

export type BusinessDocument = {
  id: number;
  type: DocumentType;
  number: string | null;
  partnerName?: string;
  routeName?: string;
  date: string;
  ownerName: string;
  partnerId?: number;
  warehouseId?: number;
  notes?: string;
  currencyCode?: string;
  paymentTermsId?: number;
  totals?: DocumentTotals;
  status: DocumentStatus;
  lines: DocumentLine[];
  allowedActions: DocumentAction[];
  sourceDocument?: RelatedDocument;
  relatedDocuments: RelatedDocument[];
  activity: DocumentActivity[];
  files: DocumentFile[];
  version: string;
};

export type DocumentListRequest = {
  view: DocumentQueueView;
  search?: string;
  page: number;
  pageSize: number;
};

export type DocumentListResponse = {
  items: BusinessDocument[];
  total: number;
  page: number;
  pageSize: number;
  counts: Partial<Record<DocumentQueueView, number>>;
};

export type DocumentCapabilitiesResponse = {
  creatableTypes: DocumentType[];
  availableQueueViews: DocumentQueueView[];
};

export type DocumentDraftRequest = {
  type: ReleaseOneDocumentType;
  partnerId?: number;
  warehouseId?: number;
  date: string;
  notes?: string;
  lines: Array<{
    productId: number;
    unitId: number;
    quantity: number;
    unitPrice?: number;
  }>;
};

export type DraftUpdateRequest = {
  version: string;
  draft: DocumentDraftRequest;
};

export type FulfillmentDraftRequest = {
  sourceDocumentId?: number;
  type: DocumentType.GOODS_RECEIPT | DocumentType.DELIVERY_NOTE;
  warehouseId?: number;
  lines: Array<{ sourceLineId?: number; productId: number; quantity: number }>;
};

export type FulfillmentPreviewRequest = {
  sourceDocumentId?: number;
  documentId?: number;
  type: DocumentType.GOODS_RECEIPT | DocumentType.DELIVERY_NOTE;
  warehouseId?: number;
  lines: Array<{ sourceLineId: number; productId: number; quantity: number }>;
};

export type FulfillmentPreviewResponse = {
  valid: boolean;
  lines: Array<{
    sourceLineId: number;
    productId: number;
    productName: string;
    warehouseName?: string;
    availableQuantity?: number;
    shortfall?: number;
    errorMessageKey?: string;
  }>;
};

export type CloseRemainingRequest = {
  reason: string;
};
