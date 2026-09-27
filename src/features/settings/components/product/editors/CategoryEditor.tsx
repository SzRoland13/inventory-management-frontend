'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductCategory } from '@/features/products/types/product';
import { Input } from '@/features/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { EditorShell, Field } from './ProductCatalogEditorShell';
import { fieldClass, selectClass } from './productCatalogEditorStyles';

export function CategoryEditor({
  open,
  item,
  categories,
  pending,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  item: ProductCategory | null;
  categories: ProductCategory[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (request: {
    parentId: number | null;
    code: string;
    name: string;
    description: string | null;
  }) => void;
}) {
  const t = useTranslations();
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [parentId, setParentId] = useState(
    item?.parentId ? String(item.parentId) : 'root',
  );
  const eligibleParents = useMemo(() => {
    const descendants = new Set<number>(item ? [item.id] : []);
    const addDescendants = (id: number) => {
      for (const category of categories) {
        if (category.parentId !== id || descendants.has(category.id)) continue;
        descendants.add(category.id);
        addDescendants(category.id);
      }
    };

    if (item) addDescendants(item.id);
    return categories.filter((category) => !descendants.has(category.id));
  }, [categories, item]);
  return (
    <EditorShell
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        item
          ? 'pages.settings.tabs.product.edit.category'
          : 'pages.settings.tabs.product.create.category',
      )}
      description={t('pages.settings.tabs.product.form.category-description')}
      pending={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (!code.trim() || !name.trim()) return;
        onSave({
          parentId: parentId === 'root' ? null : Number(parentId),
          code: code.trim(),
          name: name.trim(),
          description: description.trim() || null,
        });
      }}
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field label={t('pages.settings.tabs.product.fields.code')}>
          <Input
            required
            maxLength={100}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={t('pages.settings.tabs.product.fields.name')}>
          <Input
            required
            maxLength={150}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label={t('pages.settings.tabs.product.fields.parent')}>
        <Select
          value={parentId}
          onValueChange={(value) => setParentId(value ?? 'root')}
        >
          <SelectTrigger className={selectClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>
            <SelectItem value='root'>
              {t('pages.settings.tabs.product.fields.root-category')}
            </SelectItem>
            {eligibleParents.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t('pages.settings.tabs.product.fields.description')}>
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={fieldClass}
        />
      </Field>
    </EditorShell>
  );
}
