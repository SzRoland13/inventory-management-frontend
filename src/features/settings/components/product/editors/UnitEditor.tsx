'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductUnit } from '@/features/products/types/product';
import type { UnitRequest } from '@/features/units/services/UnitsService';
import { Input } from '@/features/shared/components/ui/input';
import { EditorShell, Field } from './ProductCatalogEditorShell';
import { fieldClass } from './productCatalogEditorStyles';

export function UnitEditor({
  open,
  item,
  pending,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  item: ProductUnit | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (request: UnitRequest) => void;
}) {
  const t = useTranslations();
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [symbol, setSymbol] = useState(item?.symbol ?? '');
  return (
    <EditorShell
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        item
          ? 'pages.settings.tabs.product.edit.unit'
          : 'pages.settings.tabs.product.create.unit',
      )}
      description={t('pages.settings.tabs.product.form.unit-description')}
      pending={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (code.trim() && name.trim() && symbol.trim())
          onSave({
            code: code.trim(),
            name: name.trim(),
            symbol: symbol.trim(),
          });
      }}
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field label={t('pages.settings.tabs.product.fields.code')}>
          <Input
            required
            maxLength={50}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={t('pages.settings.tabs.product.fields.name')}>
          <Input
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label={t('pages.settings.tabs.product.fields.symbol')}>
        <Input
          required
          maxLength={20}
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
          className={fieldClass}
        />
      </Field>
    </EditorShell>
  );
}
