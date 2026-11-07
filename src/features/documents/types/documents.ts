import {
  DocumentAction,
  DocumentFileSource,
  DocumentFileStatus,
  DocumentQueueView,
  DocumentRelationKind,
  DocumentStatus,
  DocumentType,
  DocumentCorrectionOperation,
  CommercialApprovalStatus,
  ReturnDirection,
  ReturnDisposition,
  TransferMovementOperation,
  TransferResolutionOperation,
} from '@/features/documents/enums/documentEnums';
import { UserRole } from '@/features/users/types/user';

export type OrderDocumentType =
  DocumentType.PURCHASE_ORDER | DocumentType.SALES_ORDER;
export type DraftDocumentType =
  OrderDocumentType | DocumentType.GOODS_RECEIPT | DocumentType.DELIVERY_NOTE;

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
  conversionFactorSnapshot?: number;
  mainUnit?: { id: number; code: string; name: string; symbol: string } | null;
  secondaryUnit?: { id: number; code: string; name: string; symbol: string } | null;
  secondaryUnitsPerMainUnit?: number | null;
  vatRate?: number | null;
  netAmount?: number | null;
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
  sourceQuantity?: number;
  destinationQuantity?: number;
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
  sourceWarehouseId?: number | null;
  destinationWarehouseId?: number | null;
  transitWarehouseId?: number | null;
  countedAt?: string | null;
  reason?: string | null;
  disposition?: ReturnDisposition | null;
  direction?: ReturnDirection | null;
  calculationVersion?: string | null;
  nonBillable?: boolean;
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
  paymentTerms?: string | null;
  approvalRequired?: boolean;
  approvalStatus?: CommercialApprovalStatus | null;
  approvalComment?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  financialSettlementRequired?: boolean;
  financialSettlementOwnerId?: number | null;
  financialSettlementOwnerName?: string | null;
  referenceNumber?: string | null;
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
  type: DraftDocumentType;
  currencyId: number;
  exchangeRates: DocumentExchangeRate[];
  paymentTerms?: string;
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

export type CommercialDocumentType =
  | DocumentType.SUPPLIER_BILL
  | DocumentType.CUSTOMER_INVOICE
  | DocumentType.FINANCIAL_CREDIT;

export type CommercialDraftRequest = {
  type: CommercialDocumentType;
  sourceDocumentIds: number[];
  date: string;
  currencyId: number;
  reason?: string;
  referenceNumber?: string;
  lines: Array<{
    sourceLineId: number;
    quantity: number;
    unitPrice?: number;
    vatRate?: number;
    amount?: number;
  }>;
};

export type CommercialDraftUpdateRequest = {
  version: string;
  draft: CommercialDraftRequest;
};

export type CommercialPreviewRequest = {
  draft: CommercialDraftRequest;
  excludeDocumentId?: number;
};

export type CommercialPreviewLine = {
  sourceLineId: number;
  eligibleQuantity: number;
  billedQuantity: number;
  remainingQuantity: number;
  creditedQuantity: number;
  remainingCreditableQuantity: number;
  creditedNetAmount: number;
  remainingCreditableNetAmount: number;
  requestedQuantity: number;
  requestedNetAmount: number;
};

export type CommercialPreviewResponse = {
  lines: CommercialPreviewLine[];
  totals: DocumentTotals;
  approvalRequired: boolean;
  valid: boolean;
};

export type SettlementOwner = { id: number; username: string; role: UserRole };

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
  effectiveAt?: string;
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

export type DocumentOperationLine = {
  sourceLineId?: number;
  productId: number;
  quantity: number;
  unitId?: number;
  correctedQuantity?: number;
  correctedProductId?: number;
  correctedWarehouseId?: number;
  countedQuantity?: number;
  varianceReason?: string;
  reason?: string;
  disposition?: ReturnDisposition;
  closureReopens?: Array<{
    sourceOrderLineId: number;
    quantity: number;
    reason: string;
  }>;
};
export type DocumentOperationPreview = {
  valid: boolean;
  calculationVersion?: string;
  lines: Array<{
    sourceLineId: number;
    productId: number;
    productName?: string | null;
    targetWarehouseId?: number | null;
    expectedQuantity?: number;
    countedQuantity?: number;
    variance?: number;
    rebasedTargetQuantity?: number;
    adjustmentQuantity?: number;
    correctedFulfilledQuantity?: number;
    originalQuantity?: number;
    correctedQuantity?: number;
    closedQuantity?: number;
    remainingQuantity?: number;
    sourceQuantity?: number;
    transitQuantity?: number;
    destinationQuantity?: number;
    returnableQuantity?: number;
    returnedQuantity?: number;
    quantityDelta?: number;
    resultingQuantity?: number;
    errorMessageKey?: string;
  }>;
  relatedMovements?: Array<{
    description: string;
    effectiveAt: string;
    quantity: number;
  }>;
  blockers?: string[];
  relatedReturns?: Array<{
    id: number;
    number: string | null;
    quantity: number;
  }>;
};

export type TransferDraftRequest = {
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  transitWarehouseId?: number;
  date: string;
  lines: Array<{ productId: number; unitId?: number; quantity: number }>;
};
export type TransferPreviewRequest = {
  documentId: number;
  operation: TransferMovementOperation;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  transitWarehouseId?: number;
  effectiveAt?: string;
  lines: DocumentOperationLine[];
};
export type TransferActionRequest = {
  version: string;
  idempotencyKey: string;
  operation?: TransferResolutionOperation;
  reason?: string;
  effectiveAt?: string;
  lines: DocumentOperationLine[];
};
export type ReturnRequest = {
  sourceDocumentId: number;
  direction: ReturnDirection;
  reason: string;
  effectiveAt?: string;
  warehouseId?: number;
  lines: DocumentOperationLine[];
};
export type ReturnMutationRequest = ReturnRequest & {
  idempotencyKey: string;
};
export type QuarantineReleaseRequest = {
  version: string;
  idempotencyKey: string;
  targetWarehouseId: number;
  reason: string;
  effectiveAt?: string;
  lines: DocumentOperationLine[];
};
export type ReplacementDeliveryRequest = {
  returnDocumentId: number;
  originalDeliveryId: number;
  warehouseId: number;
  date: string;
  nonBillable: true;
  effectiveAt?: string;
  lines: DocumentOperationLine[];
};
export type ReplacementDeliveryMutationRequest = ReplacementDeliveryRequest & {
  idempotencyKey: string;
};
export type StockCountRequest = {
  warehouseId: number;
  countedAt: string;
  lines: Array<{
    productId: number;
    countedQuantity?: number;
    varianceReason?: string;
  }>;
};
export type ReconciliationRequest = {
  version: string;
  calculationVersion?: string;
  idempotencyKey?: string;
  countedAt: string;
  confirmed?: boolean;
  lines: DocumentOperationLine[];
};
export type CorrectionRequest = {
  version: string;
  idempotencyKey: string;
  operation: DocumentCorrectionOperation;
  reason: string;
  effectiveAt?: string;
  lines: DocumentOperationLine[];
};
export type CorrectionPreviewRequest = Omit<
  CorrectionRequest,
  'idempotencyKey'
>;
