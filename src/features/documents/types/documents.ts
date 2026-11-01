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
  number: string | null;
  type: DocumentType;
  relationKind?: DocumentRelationKind;
};

export type DocumentLine = {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  unitName: string;
  unitId?: number | null;
  orderedQuantity: number;
  fulfilledQuantity: number;
  operationQuantity?: number;
  remainingQuantity: number;
  closedQuantity?: number;
  closureReason?: string | null;
  sourceLineId?: number | null;
  billedQuantity?: number;
  returnableQuantity?: number;
  returnedQuantity?: number;
  inTransitQuantity?: number;
  expectedQuantity?: number;
  countedQuantity?: number;
  variance?: number;
  unitPrice?: number;
  sourceUnitPrice?: number;
  sourceCurrencyId?: number | null;
  sourceAllocations?: Array<{
    sourceDocumentId: number;
    sourceLineId: number;
    sourceDocumentNumber: string;
    quantity: number;
  }>;
};

export type DocumentExchangeRate = {
  sourceCurrencyId: number;
  rate: number;
};

export type DocumentTotals = {
  currencyCode: string | null;
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
  language?: string | null;
  errorMessage?: string | null;
  downloadUrl?: string | null;
  createdAt: string;
};

export type DocumentActivity = {
  id: number;
  description: string;
  actorName: string | null;
  occurredAt: string;
};

export type BusinessDocument = {
  id: number;
  type: DocumentType;
  number: string | null;
  partnerName?: string | null;
  routeName?: string | null;
  date: string;
  ownerName: string | null;
  partnerId?: number | null;
  warehouseId?: number | null;
  notes?: string | null;
  currencyCode?: string | null;
  currencyId?: number | null;
  exchangeRates?: DocumentExchangeRate[];
  totals?: DocumentTotals | null;
  status: DocumentStatus;
  lines: DocumentLine[];
  allowedActions: DocumentAction[];
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
  currencyId: number;
  exchangeRates: DocumentExchangeRate[];
  partnerId?: number;
  warehouseId?: number;
  date: string;
  notes?: string;
  lines: Array<{
    productId: number;
    unitId: number;
    quantity: number;
    unitPrice?: number;
    sourceUnitPrice?: number;
    sourceCurrencyId?: number;
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
    quantityDelta?: number;
    resultingQuantity?: number;
    shortfall?: number;
    errorMessageKey?: string;
  }>;
};

export type CloseRemainingRequest = {
  reason: string;
};
