'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Brand } from '@/features/brands/types/brand';
import { Input } from '@/features/shared/components/ui/input';
import { EditorShell, Field } from './ProductCatalogEditorShell';
import { fieldClass } from './productCatalogEditorStyles';

export function BrandEditor({
  open,
  item,
  pending,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  item: Brand | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}) {
  const t = useTranslations();
  const [name, setName] = useState(item?.name ?? '');
  return (
    <EditorShell
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        item
          ? 'pages.settings.tabs.product.edit.brand'
          : 'pages.settings.tabs.product.create.brand',
      )}
      description={t('pages.settings.tabs.product.form.brand-description')}
      pending={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onSave(name.trim());
      }}
    >
      <Field label={t('pages.settings.tabs.product.fields.name')}>
        <Input
          autoFocus
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </Field>
    </EditorShell>
  );
}
