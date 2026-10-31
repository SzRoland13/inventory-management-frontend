import { z } from 'zod';
import { DocumentType } from '@/features/documents/enums/documentEnums';

export const documentDraftSchema = z.object({
  type: z.enum([
    DocumentType.PURCHASE_ORDER,
    DocumentType.GOODS_RECEIPT,
    DocumentType.SALES_ORDER,
    DocumentType.DELIVERY_NOTE,
  ]),
  date: z.string().min(1, 'pages.documents.validation.required'),
  partnerId: z.number().positive('pages.documents.validation.required'),
  warehouseId: z.number().positive().optional(),
  notes: z.string().max(2000, 'pages.documents.validation.notesTooLong'),
  lines: z.array(z.object({
    productId: z.number().positive(),
    unitId: z.number().positive(),
    quantity: z.number().positive('pages.documents.validation.quantity'),
    unitPrice: z.number().nonnegative().optional(),
  })).min(1, 'pages.documents.validation.addLine'),
}).superRefine((draft, context) => {
  if ((draft.type === DocumentType.GOODS_RECEIPT || draft.type === DocumentType.DELIVERY_NOTE) && !draft.warehouseId) {
    context.addIssue({ code: 'custom', path: ['warehouseId'], message: 'pages.documents.validation.warehouseRequired' });
  }
});

export const closeRemainingSchema = z.object({
  reason: z.string().trim().min(1, 'pages.documents.validation.required').max(500, 'pages.documents.validation.reasonTooLong'),
});

export type DocumentDraftFormValues = z.infer<typeof documentDraftSchema>;
