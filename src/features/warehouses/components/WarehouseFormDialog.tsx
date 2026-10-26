'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { MapPin, Warehouse as WarehouseIcon } from 'lucide-react';
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogSection,
  appDialogCancelButtonClass,
  appDialogPrimaryButtonClass,
} from '@/features/shared/components/AppDialogLayout';
import { Button } from '@/features/shared/components/ui/button';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import { Dialog } from '@/features/shared/components/ui/dialog';
import { Input } from '@/features/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/shared/components/ui/select';
import { ThemedDialogContent } from '@/features/shared/components/ThemedDialogWrapper';
import {
  warehouseFormSchema,
  warehouseFormToRequest,
  valuesFromWarehouse,
  type WarehouseFormValues,
} from '@/features/warehouses/schemas/warehouseSchemas';
import {
  WarehouseType,
  type WarehouseRequest,
  type WarehouseResponse,
} from '@/features/warehouses/types/warehouse';

interface WarehouseFormDialogProps {
  open: boolean;
  warehouse?: WarehouseResponse;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (request: WarehouseRequest) => Promise<void>;
}

export function WarehouseFormDialog({
  open,
  warehouse,
  saving,
  onOpenChange,
  onSave,
}: WarehouseFormDialogProps) {
  const t = useTranslations();
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: valuesFromWarehouse(),
  });
  const addressEnabled = useWatch({ control, name: 'addressEnabled' });
  const wasOpen = useRef(false);
  const lastWarehouseId = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    const warehouseId = warehouse?.id ?? null;
    if (!wasOpen.current || warehouseId !== lastWarehouseId.current) {
      reset(valuesFromWarehouse(warehouse));
      lastWarehouseId.current = warehouseId;
    }
    wasOpen.current = true;
  }, [open, warehouse, reset]);

  const field = (
    name:
      | 'name'
      | 'code'
      | 'country'
      | 'city'
      | 'addressLine1'
      | 'addressLine2'
      | 'phone'
      | 'email',
    maxLength: number,
  ) => (
    <div className='space-y-1'>
      <Label htmlFor={`warehouse-${name}`}>
        {t(`pages.warehouses.fields.${name}`)}
      </Label>
      <Input
        id={`warehouse-${name}`}
        maxLength={maxLength}
        aria-invalid={!!errors[name]}
        className='border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500'
        {...register(name)}
      />
      {errors[name]?.message && (
        <p className='text-sm text-red-400' role='alert'>
          {t(errors[name].message)}
        </p>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ThemedDialogContent className='!w-[96vw] !max-w-3xl'>
        <AppDialogHeader
          title={t(
            warehouse
              ? 'pages.warehouses.actions.edit'
              : 'pages.warehouses.actions.add',
          )}
          description={t('pages.warehouses.form-description')}
          icon={WarehouseIcon}
        />
        <form
          className='flex min-h-0 flex-1 flex-col'
          onSubmit={handleSubmit(async (values) => {
            await onSave(warehouseFormToRequest(values));
          })}
        >
          <AppDialogBody className='space-y-4'>
            <AppDialogSection
              title={t('pages.warehouses.form-details')}
              icon={WarehouseIcon}
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                {field('name', 150)}
                {field('code', 50)}
              </div>
              <div className='mt-4 space-y-1'>
                <Label>{t('pages.warehouses.fields.type')}</Label>
                <Controller
                  name='type'
                  control={control}
                  render={({ field: typeField }) => (
                    <Select
                      value={typeField.value}
                      onValueChange={typeField.onChange}
                    >
                      <SelectTrigger
                        className='w-full border-zinc-700 bg-zinc-900 text-zinc-100'
                        aria-label={t('pages.warehouses.fields.type')}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        position='popper'
                        side='bottom'
                        align='start'
                        avoidCollisions={false}
                        className='border-zinc-700 bg-zinc-800 text-zinc-100'
                      >
                        {Object.values(WarehouseType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`pages.warehouses.types.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className='text-xs text-zinc-400'>
                  {t('pages.warehouses.transit-hint')}
                </p>
              </div>
            </AppDialogSection>
            <AppDialogSection
              title={t('pages.warehouses.fields.address')}
              icon={MapPin}
            >
              <Controller
                name='addressEnabled'
                control={control}
                render={({ field: checkboxField }) => (
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      id='warehouse-address-enabled'
                      checked={checkboxField.value}
                      onCheckedChange={(checked) =>
                        checkboxField.onChange(checked === true)
                      }
                    />
                    <Label htmlFor='warehouse-address-enabled'>
                      {t('pages.warehouses.fields.addressEnabled')}
                    </Label>
                  </div>
                )}
              />
              {addressEnabled && (
                <div className='mt-4 grid gap-4 border-t border-zinc-700 pt-4 sm:grid-cols-2'>
                  {field('country', 2)}
                  {field('city', 100)}
                  {field('addressLine1', 255)}
                  {field('addressLine2', 255)}
                  {field('phone', 50)}
                  {field('email', 255)}
                </div>
              )}
            </AppDialogSection>
          </AppDialogBody>
          <AppDialogFooter>
            <Button
              type='button'
              variant='outline'
              className={appDialogCancelButtonClass}
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type='submit'
              className={appDialogPrimaryButtonClass}
              disabled={saving || isSubmitting}
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </AppDialogFooter>
        </form>
      </ThemedDialogContent>
    </Dialog>
  );
}
