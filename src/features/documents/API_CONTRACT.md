# Documents API contract: Existing document and warehouse workflows

All paths below are relative to the configured API v1 base URL. The common
success envelope is `{ success, messageKey, payload }`. All operations are
company-scoped and permission-checked. Mutation responses return the updated
document and linked records; stale `If-Match` versions return HTTP 409 with the
latest document in `payload`. User-provided reasons are required where
specified. `Idempotency-Key` is required for stock-posting mutations.

## Shared document additions

Extend `type`, `allowedActions`, and `relatedDocuments` with `TRANSFER_REQUEST`,
`TRANSFER_DELIVERY`, `TRANSFER_RECEIPT`, `WAREHOUSE_TRANSFER`, `RETURN`,
`STOCK_COUNT`, `STOCK_ADJUSTMENT`, `CORRECTION`, `SUPPLIER_BILL`,
`CUSTOMER_INVOICE`, and `FINANCIAL_CREDIT` types as applicable.
Transfer actions are `DISPATCH`, `RECEIVE_TRANSFER`, and `RESOLVE_TRANSIT`;
return actions are `CREATE_RETURN`, `RELEASE_QUARANTINE`, and
`CREATE_REPLACEMENT_DELIVERY`; stock count actions are `RECONCILE`; corrections
use `CORRECT`. The server returns only actions allowed to the current user.
Queue views include `TRANSFERS`, `IN_TRANSIT`, `RETURNS`, `STOCK_COUNTS`,
`CORRECTIONS`, `SUPPLIER_BILLS`, `CUSTOMER_INVOICES`, `FINANCIAL_CREDITS`,
`NEEDS_APPROVAL`, and `FINANCIAL_SETTLEMENT` when authorized.

Document lines expose optional `sourceLineId`, `returnedQuantity`,
`returnableQuantity`, `inTransitQuantity`, `expectedQuantity`,
`countedQuantity`, `variance`, `closedQuantity`, and `closureReason`. Details
expose `warehouseId`, `sourceWarehouseId`, `destinationWarehouseId`,
`transitWarehouseId`, `countedAt`, `reason`, `disposition`, `direction`,
`calculationVersion`, and `nonBillable` where relevant. Related documents
support `CREATED_FROM`, `FULFILLS`, `CANCELS`, `CORRECTS`, `RETURNS`,
`REPLACES`, `TRANSFER_STEP`, and `FINANCIAL_CREDIT`.

Document line responses include `unitId`, `conversionFactorSnapshot`,
`mainUnit`, `secondaryUnit`, and `secondaryUnitsPerMainUnit`. A quantity is
entered in the unit named by `unitId`; its conversion snapshot is the number of
stock units represented by one entered unit. When a product has a secondary
unit, stock balances and movements use that secondary unit. Operation lines
accept an optional `unitId`; omitted values preserve the source line's unit,
while new product lines default to the configured main unit.

## Transfers and transit

| Method and path                                     | Request                                                                                                                                                      | Response                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /documents/transfers/drafts`                  | `{ sourceWarehouseId, destinationWarehouseId, transitWarehouseId?, date, lines:[{productId, unitId?, quantity}] }`                                            | Transfer draft with source/destination, lines, version and allowed actions                                                                    |
| `POST /documents/transfers/preview`                 | `{ documentId?, sourceWarehouseId, destinationWarehouseId, transitWarehouseId?, operation: DISPATCH\|RECEIPT, lines:[{sourceLineId, productId, unitId?, quantity}] }` | `{ valid, lines:[{sourceLineId, sourceQuantity, transitQuantity, destinationQuantity, quantityDelta, resultingQuantity, errorMessageKey?}] }` |
| `POST /documents/transfers/{id}/resolution-preview` | `{ operation: LOSS\|DAMAGE\|REVERSAL, reason, lines:[{sourceLineId, unitId?, quantity}] }`                                                                     | `{ valid, lines:[{sourceLineId, transitQuantity, quantityDelta, resultingQuantity, errorMessageKey?}], blockers? }`                           |
| `POST /documents/transfers/{id}/dispatch`           | `{ version, idempotencyKey, lines:[{sourceLineId, unitId?, quantity}] }`                                                                                     | Posted dispatch/transfer state with fixed warehouse IDs and remaining-in-transit quantities                                                   |
| `POST /documents/transfers/{id}/receipt`            | `{ version, idempotencyKey, lines:[{sourceLineId, unitId?, quantity}] }`                                                                                     | Receipt state and quantities; reject receipts above dispatched outstanding quantities                                                         |
| `POST /documents/transfers/{id}/resolve`            | `{ version, idempotencyKey, operation: LOSS\|DAMAGE\|REVERSAL\|REMAINDER_CLOSURE, reason, lines:[{sourceLineId, unitId?, quantity}] }`                       | Linked resolution/closure document and updated transfer quantities/history                                                                    |

Dispatch and receipt accept `If-Match` and `Idempotency-Key` headers (the body
`version`/`idempotencyKey` fields are equivalent fallback inputs).
Source/destination warehouses cannot change after posted dispatch. Dispatch,
receipt, and resolution update paired stock movements atomically. Posted
dispatches cannot be deleted.

## Returns, quarantine, and replacements

| Method and path                                          | Request                                                                                                                                                                                                                    | Response                                                                                                                       |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `POST /documents/returns`                                | `Idempotency-Key` header; `{ sourceDocumentId, direction: CUSTOMER_RETURN\|SUPPLIER_RETURN, reason, warehouseId?, lines:[{sourceLineId, unitId?, quantity, disposition: RESTOCK\|QUARANTINE\|DAMAGED\|SUPPLIER_RETURN, reason?}] }` | Return with original/returned/returnable quantities, warehouse destination and links                                           |
| `POST /documents/returns/preview`                        | Return creation body without the idempotency header                                                                                                                                                                        | `{ valid, lines:[{sourceLineId, returnableQuantity, quantityDelta, resultingQuantity, targetWarehouseId, errorMessageKey?}] }` |
| `POST /documents/{id}/quarantine-release/preview`        | `{ lines:[{sourceLineId, unitId?, quantity}], targetWarehouseId, reason }`                                                                                                                                               | `{ valid, lines:[{sourceLineId, quantityDelta, resultingQuantity, errorMessageKey?}] }`                                        |
| `POST /documents/{id}/quarantine-release`                | `{ version, idempotencyKey, lines:[{sourceLineId, unitId?, quantity}], targetWarehouseId, reason }`                                                                                                                       | Linked release document and updated quarantine/sellable quantities                                                             |
| `POST /documents/returns/replacement-deliveries`         | `Idempotency-Key` header; `{ returnDocumentId, originalDeliveryId, warehouseId, date, nonBillable:true, lines:[{sourceLineId, productId, unitId?, quantity}] }`                                                            | Linked replacement delivery with `nonBillable: true` by default                                                                |
| `POST /documents/returns/replacement-deliveries/preview` | Replacement delivery request shape                                                                                                                                                                                         | `{ valid, lines:[{sourceLineId, quantityDelta, resultingQuantity, errorMessageKey?}] }`                                        |

Return quantities may not exceed received/delivered minus previous returns.
Physical returns do not reopen source-order quantities. QUARANTINE and DAMAGED
dispositions go to the dedicated QUARANTINE warehouse and remain excluded from
available/sellable stock until explicit release. Quarantine release is
restricted to ADMIN and MANAGER; the API returns `RELEASE_QUARANTINE` only for
permitted users.

## Stock counts and reconciliation

| Method and path                                            | Request                                                                             | Response                                                                                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /documents/stock-counts`                             | `{ warehouseId, countedAt, lines:[{productId, countedQuantity, varianceReason?}] }` | Count draft with expected quantities at count time and version                                                                                                                       |
| `POST /documents/stock-counts/{id}/reconciliation-preview` | `{ version, countedAt, lines:[{sourceLineId, countedQuantity, varianceReason?}] }`  | `{ valid, calculationVersion, lines:[{sourceLineId, expectedAtCount, countedQuantity, variance, movementsSinceCount:[...], rebasedTargetQuantity, adjustmentQuantity}], blockers? }` |
| `POST /documents/stock-counts/{id}/post`                   | `{ version, calculationVersion, idempotencyKey, confirmed:true }`                   | Posted count, adjustment document, and resulting stock movements                                                                                                                     |

Reconciliation applies movements by effective movement time. A movement entered
later with an effective time before `countedAt` refreshes the expected-at-count
baseline and variance. Reject posting if the calculation version is stale; the
client must fetch a fresh preview. The preview supports the acceptance example:
book 10 at count time, physical count 8, later dispatch 3, current book 7 =>
rebased target 5 and adjustment -2.

## Posted document corrections

| Method and path                            | Request                                                                                                                                                                              | Response                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /documents/{id}/corrections/preview` | `{ version, operation: CORRECT_RECORDING, reason, lines:[{sourceLineId, unitId?, correctedQuantity, correctedProductId?, correctedWarehouseId?}] }`                                           | `{ valid, lines:[{sourceLineId, originalQuantity, correctedQuantity, correctedFulfilledQuantity, closedQuantity, returnedQuantity, remainingQuantity, targetWarehouseId?, quantityDelta, resultingQuantity}], relatedReturns, laterMovements, blockers? }` |
| `POST /documents/{id}/corrections`         | `If-Match` and `Idempotency-Key` headers; `{ version, operation: CORRECT_RECORDING, reason, lines:[{sourceLineId, unitId?, correctedQuantity, correctedProductId?, correctedWarehouseId?}] }` | Immutable linked correction document with signed stock deltas and fulfillment values                                                                                                                                                                       |

Physical returns and return shipments must use the return workflow, never the
recording-error correction endpoint. The backend must reject negative-stock,
duplicate-restoration, or inconsistent closed-quantity results with actionable
blockers. Corrections never edit/cancel the original document or silently change
related documents/movements. Billing rematching, approval invalidation, and
financial settlement are handled by the commercial document workflow below.

## Commercial documents

`POST /documents/commercial/preview` accepts
`{draft: CommercialDraft, excludeDocumentId?}` and returns `{lines, totals,
approvalRequired, valid}` without persisting a document. Each line reports the
eligible, billed, remaining, credited, and remaining-creditable quantities,
credited and remaining net amounts, alongside the requested allocation.
Existing drafts reserve billing and credit availability;
`excludeDocumentId` is accepted only for an editable company-scoped draft.
Totals use the same per-line rounding as persisted
documents. Preview balances are advisory; create and update revalidate them.

`POST /documents/commercial/drafts` accepts
`{type: SUPPLIER_BILL|CUSTOMER_INVOICE|FINANCIAL_CREDIT, sourceDocumentIds,
date, currencyId, reason?, referenceNumber?, lines:[{sourceLineId, quantity,
unitPrice?, vatRate?, amount?}]}`. Draft lines retain source line, currency,
VAT, and product snapshots. Bills are sourced from completed goods receipts;
customer invoices are sourced from completed, billable delivery notes.
Consolidated customer sources must match company, customer, currency, and
payment terms. Draft and final invoice quantities count against source quantity.
Credit drafts reference one received supplier bill or issued customer invoice;
`amount` is an optional net amount allocation, capped with quantity by the
source line's remaining creditable balance.

`PUT /documents/{id}/commercial/draft` accepts `{version, draft}` and updates
the existing source allocations. It resets prior approval. Price or VAT
differences set `approvalRequired=true` and `approvalStatus=PENDING`.
`POST /documents/{id}/commercial/approve` and `/reject` accept
`{version, comment}` and require ADMIN or MANAGER. A discrepancy must be
approved before finalization. `POST /documents/{id}/commercial/finalize` accepts
`If-Match`; supplier bills become `RECEIVED`, customer invoices become `ISSUED`,
and credits become `COMPLETED`. These operations do not post stock movements.

When a posted receipt or delivery correction affects a draft commercial record,
matching is refreshed and prior approval is cleared. A finalized bill or invoice
stays unchanged and is flagged `financialSettlementRequired`.
`POST /documents/{id}/commercial/settlement-owner` accepts
`{version, ownerId}` and assigns a company user. Commercial detail responses
include payment terms, approval decision and timestamp, settlement state and
owner, and line `billedQuantity`, `vatRate`, and `netAmount`.

## Existing document behavior

Keep the existing capabilities/list/detail/draft, fulfillment preview/post,
confirm, close-remaining, file upload and PDF routes and payloads. Existing
document status, conflict, currency, file authorization, and idempotency
behaviors remain unchanged. Add fields and actions without removing existing
response fields.

Existing clients expect `GET /documents/capabilities` to return authorized
`creatableTypes` and `availableQueueViews`;
`GET /documents?view=&search=&page=&pageSize=` to return
`{items,total,page,pageSize,counts}`; and `GET /documents/{id}` to return full
detail. Draft endpoints are `POST /documents/drafts` and
`PUT /documents/{id}/draft` with `{version,draft}`. Draft input includes
document type/date/currency/exchange-rate snapshots, optional
partner/warehouse/notes, and product lines with unit, quantity, and
source-currency price. Incomplete draft edits may be saved progressively; stale
versions return 409 with the latest document.

Existing fulfillment endpoints are `POST /documents/fulfillments/drafts`,
`POST /documents/fulfillments/preview`, `POST /documents/{id}/post`,
`POST /documents/{id}/confirm`, and `POST /documents/{id}/close-remaining`.
Preview returns per-line validation and signed stock effects, including
available quantity and shortfall for insufficient deliveries. Posting is atomic
and idempotent; post/confirm/close calls accept `If-Match` with the current
document version.
Stock-posting requests may include `effectiveAt` as a local date-time string
(`YYYY-MM-DDTHH:mm`). It records when the stock movement took effect; the
movement creation timestamp remains the time the operation was posted. When
omitted, the backend uses posting time. Fulfillment posting accepts this value
in its optional JSON body, and transfer, return, quarantine release,
replacement, and correction requests accept it alongside their existing
fields.

File endpoints remain `POST /documents/{id}/files`,
`POST /documents/{id}/pdf`, `POST /documents/{id}/pdf/retry`, and secured file
URLs in document detail. PDF generation accepts `language=en|hu`; queued
generation states are `QUEUED`, `PROCESSING`, `COMPLETED`, and `FAILED`.
PDF retry requires an `Idempotency-Key` header and is available only when the
latest generated PDF attempt failed. Reuse the same key when retrying the same
request; active attempts and latest attempts that did not fail are rejected.

Correcting a posted fulfillment may include `closureReopens` on a correction
line. Each entry contains `sourceOrderLineId`, positive `quantity`, and a
nonblank `reason`. The order line must be allocated to that correction line,
and the requested quantity cannot exceed its currently closed quantity. The
backend validates corrected fulfillment together with the remaining closed
quantity and rejects totals above the ordered quantity. Omit the array or send
an empty array when no closure needs to be reopened.

Document responses retain `id`, `type`, nullable `number`, `date`, `ownerName`,
`status`, string `version`, `lines`, `allowedActions`, `relatedDocuments`,
`activity`, and `files`, plus currency snapshots and totals. Current statuses
are `DRAFT`, `SENT`, `CONFIRMED`, `PARTIALLY_COMPLETED`, `COMPLETED`,
`RECEIVED`, `ISSUED`, and `CANCELLED`. Existing action values include `EDIT`,
`CONFIRM`, `POST`, `UPLOAD_FILE`, `GENERATE_PDF`, `RETRY_PDF`,
`CLOSE_REMAINING`, `APPROVE`, `REJECT`, `FINALIZE`, and `ASSIGN_SETTLEMENT`. Lines retain
ordered, fulfilled, closed, remaining quantities and unit-price/source-currency
snapshots. HTTP 409 uses `document.error.conflict` and the latest document in
`payload`; clients retain their local edits until the user reloads or resaves.
