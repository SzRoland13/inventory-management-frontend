'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X } from 'lucide-react';
import {
  ProductAttributeValueType,
  type ProductAttributeDefinition,
  type ProductAttributeValueType as ProductAttributeValueTypeValue,
} from '@/features/products/types/product';
import { Button } from '@/features/shared/components/ui/button';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
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

export function AttributeEditor({
  open,
  item,
  pending,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  item: ProductAttributeDefinition | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (request: {
    code: string;
    name: string;
    valueType: ProductAttributeValueTypeValue;
    required: boolean;
    options: string[];
  }) => void;
}) {
  const t = useTranslations();
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [valueType, setValueType] = useState<ProductAttributeValueTypeValue>(
    item?.valueType ?? ProductAttributeValueType.TEXT,
  );
  const [required, setRequired] = useState(item?.required ?? false);
  const [options, setOptions] = useState<string[]>([]);
  const [optionDraft, setOptionDraft] = useState('');
  const addOption = () => {
    const value = optionDraft.trim();
    if (
      !value ||
      options.some(
        (option) => option.toLocaleLowerCase() === value.toLocaleLowerCase(),
      ) ||
      item?.options.some(
        (option) =>
          option.value.toLocaleLowerCase() === value.toLocaleLowerCase(),
      )
    )
      return;
    setOptions((current) => [...current, value]);
    setOptionDraft('');
  };
  return (
    <EditorShell
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        item
          ? 'pages.settings.tabs.product.edit.attribute'
          : 'pages.settings.tabs.product.create.attribute',
      )}
      description={t('pages.settings.tabs.product.form.attribute-description')}
      pending={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (code.trim() && name.trim())
          onSave({
            code: code.trim(),
            name: name.trim(),
            valueType,
            required,
            options,
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
      <Field label={t('pages.settings.tabs.product.fields.value-type')}>
        <Select
          value={valueType}
          onValueChange={(value) =>
            value && setValueType(value as ProductAttributeValueTypeValue)
          }
        >
          <SelectTrigger className={selectClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='border-zinc-700 bg-zinc-800 text-zinc-100'>
            {Object.values(ProductAttributeValueType).map((type) => (
              <SelectItem key={type} value={type}>
                {t(`pages.settings.tabs.product.value-types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {valueType === ProductAttributeValueType.FIXED && (
        <Field label={t('pages.settings.tabs.product.options.allowed-values')}>
          <div className='space-y-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3'>
            <div className='flex gap-2'>
              <Input
                value={optionDraft}
                maxLength={150}
                onChange={(event) => setOptionDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addOption();
                  }
                }}
                placeholder={t(
                  'pages.settings.tabs.product.options.placeholder',
                )}
                className={fieldClass}
              />
              <Button
                type='button'
                disabled={!optionDraft.trim()}
                onClick={addOption}
                className='shrink-0 bg-sky-500 text-zinc-950 hover:bg-sky-400 disabled:bg-sky-900/70 disabled:text-sky-100/70'
              >
                <Plus />
                {t('pages.settings.tabs.product.actions.add-option')}
              </Button>
            </div>
            <p className='text-xs text-zinc-500'>
              {t('pages.settings.tabs.product.options.description')}
            </p>
            {(item?.options ?? []).length > 0 || options.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {item?.options.map((option) => (
                  <span
                    key={option.id}
                    className='rounded-full border border-zinc-600 bg-zinc-900 px-3 py-1 text-xs text-zinc-200'
                  >
                    {option.value}
                  </span>
                ))}
                {options.map((option, index) => (
                  <span
                    key={`${option}-${index}`}
                    className='inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 py-1 pl-3 pr-1 text-xs text-sky-200'
                  >
                    {option}
                    <button
                      type='button'
                      aria-label={`${t('common.cancel')} ${option}`}
                      className='rounded-full p-1 hover:bg-sky-400/20'
                      onClick={() =>
                        setOptions((current) =>
                          current.filter(
                            (_, optionIndex) => optionIndex !== index,
                          ),
                        )
                      }
                    >
                      <X className='size-3' />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-xs text-zinc-500'>
                {t('pages.settings.tabs.product.options.empty')}
              </p>
            )}
          </div>
        </Field>
      )}
      <label className='flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3'>
        <Checkbox
          checked={required}
          onCheckedChange={(value) => setRequired(value === true)}
        />
        <span>
          <span className='block text-sm font-medium text-zinc-200'>
            {t('pages.settings.tabs.product.fields.required')}
          </span>
          <span className='block text-xs text-zinc-500'>
            {t('pages.settings.tabs.product.fields.required-description')}
          </span>
        </span>
      </label>
    </EditorShell>
  );
}
