'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import {
  ProductAttributeValueType,
  type ProductAttributeDefinition,
} from '@/features/products/types/product';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { fieldClass } from './productCatalogEditorStyles';

export function AttributeOptionsPanel({
  attribute,
  admin,
  onSave,
  onDelete,
}: {
  attribute: ProductAttributeDefinition;
  admin: boolean;
  onSave: (
    definitionId: number,
    optionId: number | null,
    value: string,
    sortOrder: number,
  ) => Promise<void>;
  onDelete: (option: ProductAttributeDefinition['options'][number]) => void;
}) {
  const t = useTranslations();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [busy, setBusy] = useState(false);
  if (attribute.valueType !== ProductAttributeValueType.FIXED) return null;
  const saveEdit = async (optionId: number, sortOrder: number) => {
    if (!editingValue.trim()) return;
    setBusy(true);
    try {
      await onSave(attribute.id, optionId, editingValue.trim(), sortOrder);
      setEditingId(null);
    } catch {
      /* Error is surfaced by the parent. */
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className='mt-5 rounded-xl border border-sky-400/20 bg-sky-400/[0.035] p-4 sm:p-5'>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-sm font-semibold text-zinc-100'>
            {t('pages.settings.tabs.product.options.title', {
              name: attribute.name,
            })}
          </h3>
          <p className='mt-1 text-xs text-zinc-500'>
            {t('pages.settings.tabs.product.options.description')}
          </p>
        </div>
        <span className='rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400'>
          {attribute.options.length}
        </span>
      </div>
      {attribute.options.length > 0 ? (
        <div className='mb-4 grid gap-2'>
          {attribute.options.map((option) => (
            <div
              key={option.id}
              className='flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/50 p-2'
            >
              {editingId === option.id ? (
                <>
                  <Input
                    autoFocus
                    value={editingValue}
                    maxLength={150}
                    onChange={(event) => setEditingValue(event.target.value)}
                    className={fieldClass}
                  />
                  <Button
                    size='icon-sm'
                    disabled={busy}
                    aria-label={t(
                      'pages.settings.tabs.product.actions.save-option',
                    )}
                    onClick={() => void saveEdit(option.id, option.sortOrder)}
                  >
                    <Check />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('common.cancel')}
                    onClick={() => setEditingId(null)}
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <span className='min-w-0 flex-1 truncate px-2 text-sm text-zinc-200'>
                    {option.value}
                  </span>
                  {admin && (
                    <>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={`${t('pages.settings.tabs.product.actions.edit')} ${option.value}`}
                        className='text-zinc-400'
                        onClick={() => {
                          setEditingId(option.id);
                          setEditingValue(option.value);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={`${t('pages.settings.tabs.product.actions.delete')} ${option.value}`}
                        className='text-zinc-500 hover:text-rose-300'
                        onClick={() => onDelete(option)}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className='mb-4 rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-center text-sm text-zinc-500'>
          {t('pages.settings.tabs.product.options.empty')}
        </p>
      )}
    </div>
  );
}
