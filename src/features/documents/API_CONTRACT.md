# Documents API contract needed by the frontend

The frontend services use the paths below under the configured API v1 base URL. Backend can map these to its preferred routes, but the request/response capabilities and concurrency/error behavior need to remain available.

## Common response and errors

- Successful operations use `{ success, messageKey, payload }`.
- A document response includes `id`, `type`, nullable `number`, `date`, `ownerName`, `status`, string `version`, `lines`, `allowedActions`, `relatedDocuments`, `activity`, and `files`. It also includes the document `currencyId`/`currencyCode`, saved `exchangeRates` (`sourceCurrencyId`, `rate`), and totals.
- The implemented lifecycle statuses are `DRAFT`, `SENT`, `CONFIRMED`, `PARTIALLY_COMPLETED`, `COMPLETED`, and `CANCELLED`. The backend returns only actions authorized for that document and user: `EDIT`, `CONFIRM`, `POST`, `UPLOAD_FILE`, `GENERATE_PDF`, `RETRY_PDF`, and `CLOSE_REMAINING` as applicable.
- A line includes product ID/name/code, unit name, ordered, fulfilled, closed, remaining, optional operation quantity, `unitPrice` in document currency, `sourceUnitPrice` in the source currency, and `sourceCurrencyId`, plus closure reason and optional source line ID. The response omits `unitId`; when editing, the frontend resolves it from the product’s main or secondary unit by matching the unit name. If it cannot resolve the unit, it keeps edits local and blocks the update.
- A conflict is HTTP 409 with `document.error.conflict` and the latest document in `payload`. Keep unsaved editor values until the user reloads the latest version or explicitly saves their values against it.
- Related document `relationKind` values are `CREATED_FROM`, `FULFILLS`, or `CANCELS`.

## Queue and draft endpoints

| Method and path               | Request                                                                                                                                   | Response                                                                                                                                                       |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `GET /documents/capabilities` | —                                                                                                                                         | `creatableTypes` and `availableQueueViews` authorized for the current user/company; the frontend uses these to expose only supported queues and create options |
| `GET /documents`              | `view` (`MY_DRAFTS`, `READY_TO_RECEIVE`, `READY_TO_SHIP`, `PARTIALLY_FULFILLED`, `ALL`), optional `search`, zero-based `page`, `pageSize` | `{ items, total, page, pageSize, counts }`; counts contain each queue view total and each item contains summary data plus actions                              |
| `GET /documents/{id}`         | —                                                                                                                                         | Full document detail                                                                                                                                           |
| `POST /documents/drafts`      | type, date, `currencyId`, `exchangeRates` (`sourceCurrencyId`, `rate`), optional partner/warehouse/notes, lines (`sourceUnitPrice` and `sourceCurrencyId`) | Created draft with version token; prices and totals are calculated in document currency; direct receipt/delivery drafts require a warehouse |
| `PUT /documents/{id}/draft`   | `{ version, draft }` with the same currency, rates, and line source-currency prices/IDs                                                  | Updated draft with new version token; stale version returns 409 and latest document                                                                            |

Rates use target currency units per one source currency unit. Products with no assigned currency use the company preferred currency. Every distinct source currency used by the lines must have exactly one positive rate unless it is already the document currency. Draft updates submit `sourceUnitPrice` and `sourceCurrencyId` so the backend never reconverts a previously converted `unitPrice` or loses the source-currency snapshot when a product's currency later changes. Older clients may omit `sourceCurrencyId`; the backend then uses the product currency, falling back to the company preferred currency.

Draft edits need to support incomplete drafts so the UI can autosave progressively. Save responses must distinguish accepted/saved state from validation errors. Number allocation is company scoped and follows the existing server-side document sequence rules.

## Fulfillment endpoints

| Method and path                        | Request                                                                                                                  | Response                                                                                                                                                                                                                    |
|----------------------------------------|--------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `POST /documents/fulfillments/drafts`  | Optional source document ID, receipt/delivery type, optional warehouse, and line quantities                              | Draft with source snapshots and ordered/fulfilled/operation/remaining quantities                                                                                                                                            |
| `POST /documents/fulfillments/preview` | `sourceDocumentId` for order-derived work or `documentId` for direct draft, warehouse, and proposed operation quantities | Per-line quantity validation and stock effect, including warehouse, signed quantity delta, and resulting on-hand quantity when available; delivery shortfalls include product, warehouse, available quantity, and shortfall |
| `POST /documents/{id}/post`            | `Idempotency-Key` and required `If-Match` version headers | Posted document with resulting links and updated fulfillment quantities; repeated key must not post stock twice |
| `POST /documents/{id}/confirm`         | Required `If-Match` version header | Confirmed order; confirmation does not change physical stock |
| `POST /documents/{id}/close-remaining` | `{ reason }` and required `If-Match` version header | Updated order and line totals including closed quantity and reason |

Server validation remains authoritative. A delivery that would make on-hand stock negative must fail without posting and return actionable line-level details. Direct receipts/deliveries must be explicitly authorized by the endpoint response/actions for the document type and user.

## Files and generated PDFs

| Method and path                  | Request                     | Response                                                                                                                                                                  |
|----------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `POST /documents/{id}/files`     | Multipart form field `file` | Updated document or file metadata                                                                                                                                         |
| `POST /documents/{id}/pdf` | Optional idempotency key and `language` query parameter (`en` or `hu`, default `en`) | Queued generation state |
| `POST /documents/{id}/pdf/retry` | Optional idempotency key | Queued generation state using the language of the previous attempt, or English when none exists |
| `GET /documents/{id}`            | —                           | File entries distinguish `UPLOAD` and `GENERATED_PDF`; generated files expose `QUEUED`, `PROCESSING`, `COMPLETED`, or `FAILED` plus a secured download URL when completed |

File metadata includes ID, filename, content type, source, creation time, generation status when applicable, and a secured download/open URL. Authorization is enforced by the backend for upload, retry, and file access. The client polls detail while a PDF is queued or processing and stops when it reaches a terminal state.

The frontend offers English and Hungarian generation choices only when `GENERATE_PDF` is present in `allowedActions`. Confirm, post, and close-remaining calls must send the current document version in `If-Match`.

## Extension points for Releases 2 and 3

Capabilities and queue views are not limited to Release 1. The shared document response keeps `type`, `status`, actions, and typed relations open to new document families; each release adds feature-owned forms and action dialogs while reusing the queue, detail shell, files, activity, and relation chain.

- **Transfers/transit (IM-64/65):** transfer preview and dispatch/receipt operations return source, transit, and destination quantities per line, remaining-in-transit quantities, fixed posted warehouse IDs, and actionable over-receipt/conflict errors. Loss/damage resolution and correction/reversal are separate reasoned actions; posted dispatches cannot be deleted.
- **Returns/quarantine/replacements (IM-72/74):** return creation identifies the original receipt/delivery and line allocations, direction, previously returned and returnable quantity, reason, and per-line disposition. Quarantine release returns allowed actions by role and requires inspected quantity, target warehouse, reason, and stock preview. Replacement deliveries retain links to both return and original delivery and expose a non-billable-by-default flag.
- **Stock counts (IM-73/75):** count operations carry warehouse and `countedAt`, expected and counted quantities, and per-line variance reasons. Reconciliation returns the count-time baseline, late/backdated movements, rebased target, adjustment, and a calculation version. Posting must reject stale calculation versions and require a fresh preview.
- **Posted corrections (IM-80/81):** corrections create immutable linked records with affected source lines, corrected fulfillment, signed stock deltas, reason, and related returns/later movements. Preview must report blockers such as negative stock, duplicate restoration, or inconsistent closed quantities; it must never mutate the original posted document.
- **Bills, invoices, credits, matching, and approvals (IM-66/67/76–79):** use explicit supplier-bill and customer-invoice types, line-level source allocations, eligible/previously billed/remaining quantities, currency, VAT, totals, and rounding. Invoice matching returns eligibility and discrepancy details; combined delivery notes must satisfy company/customer/currency/payment-term constraints. Credits track original, credited, and remaining amounts and never create stock movements. Approval returns approver, decision, comment, and invalidation state; source corrections must distinguish draft rematching from final-invoice “Financial settlement required” follow-up.
