import { DocumentRelationKind } from '@/features/documents/enums/documentEnums';
import type { BusinessDocument } from '@/features/documents/types/documents';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export function documentTypeLabel(
  type: BusinessDocument['type'],
  t: Translator,
) {
  const key = `pages.documents.types.${type}`;
  return t.has(key) ? t(key) : type.toLocaleLowerCase().replaceAll('_', ' ');
}

export function documentRelationLabel(
  relation: DocumentRelationKind,
  t: Translator,
) {
  const key = `pages.documents.details.relations.${relation}`;
  return t.has(key) ? t(key) : t('pages.documents.details.relatedDocument');
}

export function documentStatusLabel(
  status: BusinessDocument['status'],
  t: Translator,
) {
  const key = `pages.documents.status.${status}`;
  return t.has(key) ? t(key) : status.toLocaleLowerCase().replaceAll('_', ' ');
}

export function documentActionLabel(action: string | undefined, t: Translator) {
  const key = action
    ? `pages.documents.actions.${action}`
    : 'pages.documents.actions.view';
  return t.has(key)
    ? t(key)
    : (action?.toLocaleLowerCase().replaceAll('_', ' ') ??
        t('pages.documents.actions.view'));
}

export function formatDocumentDate(value: string, locale: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDocumentTimestamp(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDocumentAmount(
  amount: number,
  currencyCode: string | null | undefined,
  locale: string,
) {
  const formatter = currencyCode
    ? new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
      })
    : new Intl.NumberFormat(locale, {
        style: 'decimal',
        maximumFractionDigits: 2,
      });
  return formatter.format(amount);
}
