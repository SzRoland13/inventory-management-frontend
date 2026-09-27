'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  GripVertical,
  Layers3,
  Plus,
  Ruler,
  Search,
  Tags,
} from 'lucide-react';
import { useSessionQuery } from '@/features/auth/queries/authQueries';
import { UserRole } from '@/features/users/types/user';
import {
  useBrandsQuery,
  useCreateBrandMutation,
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from '@/features/brands/queries/brandQueries';
import type { Brand } from '@/features/brands/types/brand';
import {
  useCreateAttributeMutation,
  useCreateAttributeOptionMutation,
  useCreateCategoryMutation,
  useDeleteAttributeMutation,
  useDeleteAttributeOptionMutation,
  useDeleteCategoryMutation,
  useCreateUnitMutation,
  useDeleteUnitMutation,
  useProductAttributeDefinitionsQuery,
  useProductCategoriesQuery,
  useProductUnitsQuery,
  useReorderCategoriesMutation,
  useUpdateAttributeMutation,
  useUpdateAttributeOptionMutation,
  useUpdateCategoryMutation,
  useUpdateUnitMutation,
} from '@/features/products/queries/productQueries';
import {
  ProductAttributeValueType,
  type ProductAttributeDefinition,
  type ProductAttributeValueType as ProductAttributeValueTypeValue,
  type ProductCategory,
  type ProductUnit,
} from '@/features/products/types/product';
import { toastApiError } from '@/features/shared/api/apiResponse';
import CardWrapper from '@/features/shared/components/CardWrapper';
import { Button } from '@/features/shared/components/ui/button';
import { Input } from '@/features/shared/components/ui/input';
import { Routes } from '@/features/shared/types/routes';
import { SettingsTab } from '@/features/settings/types/settings';
import { CatalogRow } from '@/features/settings/components/product/ProductCatalogRow';
import { AttributeEditor } from '@/features/settings/components/product/editors/AttributeEditor';
import { AttributeOptionsPanel } from '@/features/settings/components/product/editors/AttributeOptionsPanel';
import { BrandEditor } from '@/features/settings/components/product/editors/BrandEditor';
import { CategoryEditor } from '@/features/settings/components/product/editors/CategoryEditor';
import { UnitEditor } from '@/features/settings/components/product/editors/UnitEditor';
import { buildCategoryTree } from '@/features/settings/components/product/productCatalogHelpers';
import {
  ProductCatalogDeleteDialog,
  type ProductCatalogDeleteTarget,
} from '@/features/settings/components/product/ProductCatalogDeleteDialog';

type CatalogSection = 'units' | 'brands' | 'categories' | 'attributes';
const isCatalogSection = (value: string | null): value is CatalogSection =>
  value === 'units' ||
  value === 'brands' ||
  value === 'categories' ||
  value === 'attributes';
type Editor =
  | { type: 'unit'; item: ProductUnit | null }
  | { type: 'brand'; item: Brand | null }
  | { type: 'category'; item: ProductCategory | null }
  | { type: 'attribute'; item: ProductAttributeDefinition | null }
  | null;
const fieldClass =
  'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-400';
const EMPTY_BRANDS: Brand[] = [];
const EMPTY_CATEGORIES: ProductCategory[] = [];
const EMPTY_ATTRIBUTES: ProductAttributeDefinition[] = [];
const EMPTY_UNITS: ProductUnit[] = [];

export default function ProductTab() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSessionQuery();
  const isAdmin = session.data?.payload.role === UserRole.ADMIN;
  const productSectionParam = searchParams.get('productTab');
  const section: CatalogSection = isCatalogSection(productSectionParam)
    ? productSectionParam
    : 'units';
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Editor>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ProductCatalogDeleteTarget | null>(null);
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | null>(
    null,
  );
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [draggedCategoryId, setDraggedCategoryId] = useState<number | null>(
    null,
  );
  const [dropCategoryId, setDropCategoryId] = useState<number | null>(null);
  const brandsQuery = useBrandsQuery();
  const categoriesQuery = useProductCategoriesQuery();
  const attributesQuery = useProductAttributeDefinitionsQuery();
  const unitsQuery = useProductUnitsQuery();
  const createBrand = useCreateBrandMutation();
  const updateBrand = useUpdateBrandMutation();
  const deleteBrand = useDeleteBrandMutation();
  const createCategory = useCreateCategoryMutation();
  const updateCategory = useUpdateCategoryMutation();
  const deleteCategory = useDeleteCategoryMutation();
  const reorderCategories = useReorderCategoriesMutation();
  const createAttribute = useCreateAttributeMutation();
  const updateAttribute = useUpdateAttributeMutation();
  const deleteAttribute = useDeleteAttributeMutation();
  const createOption = useCreateAttributeOptionMutation();
  const updateOption = useUpdateAttributeOptionMutation();
  const deleteOption = useDeleteAttributeOptionMutation();
  const createUnit = useCreateUnitMutation();
  const updateUnit = useUpdateUnitMutation();
  const deleteUnit = useDeleteUnitMutation();

  const onSectionChange = (nextSection: CatalogSection) => {
    setSearch('');
    router.replace({
      pathname: Routes.Settings,
      query: { tab: SettingsTab.Product, productTab: nextSection },
    });
  };

  const openCreateEditor = () => {
    switch (section) {
      case 'units':
        setEditor({ type: 'unit', item: null });
        break;
      case 'brands':
        setEditor({ type: 'brand', item: null });
        break;
      case 'categories':
        setEditor({ type: 'category', item: null });
        break;
      case 'attributes':
        setEditor({ type: 'attribute', item: null });
        break;
    }
  };

  const brands = brandsQuery.data?.payload ?? EMPTY_BRANDS;
  const categories = categoriesQuery.data?.payload ?? EMPTY_CATEGORIES;
  const attributes = attributesQuery.data?.payload ?? EMPTY_ATTRIBUTES;
  const units = unitsQuery.data?.payload ?? EMPTY_UNITS;
  const selectedAttribute =
    attributes.find((item) => item.id === selectedAttributeId) ?? null;
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredBrands = useMemo(
    () =>
      brands.filter((item) =>
        item.name.toLocaleLowerCase().includes(normalizedSearch),
      ),
    [brands, normalizedSearch],
  );
  const filteredCategories = useMemo(
    () =>
      categories.filter((item) =>
        `${item.name} ${item.code} ${item.description ?? ''}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      ),
    [categories, normalizedSearch],
  );
  const categoryTree = useMemo(
    () => buildCategoryTree(categories, normalizedSearch, collapsedCategoryIds),
    [categories, normalizedSearch, collapsedCategoryIds],
  );
  const filteredAttributes = useMemo(
    () =>
      attributes.filter((item) =>
        `${item.name} ${item.code} ${item.valueType}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      ),
    [attributes, normalizedSearch],
  );
  const filteredUnits = useMemo(
    () =>
      units.filter((item) =>
        `${item.name} ${item.code} ${item.symbol}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      ),
    [units, normalizedSearch],
  );

  const notifyError = (error: unknown) => toastApiError(t, error);
  const saveBrand = async (name: string) => {
    try {
      if (editor?.type !== 'brand') return;
      if (editor.item)
        await updateBrand.mutateAsync({
          id: editor.item.id,
          request: { name },
        });
      else await createBrand.mutateAsync({ name });
      toast(t('pages.settings.tabs.product.messages.saved'));
      setEditor(null);
    } catch (error) {
      notifyError(error);
    }
  };
  const saveUnit = async (request: {
    code: string;
    name: string;
    symbol: string;
  }) => {
    try {
      if (editor?.type !== 'unit') return;
      if (editor.item)
        await updateUnit.mutateAsync({ id: editor.item.id, request });
      else await createUnit.mutateAsync(request);
      toast(t('pages.settings.tabs.product.messages.saved'));
      setEditor(null);
    } catch (error) {
      notifyError(error);
    }
  };
  const saveCategory = async (request: {
    parentId: number | null;
    code: string;
    name: string;
    description: string | null;
  }) => {
    try {
      if (editor?.type !== 'category') return;
      const movingToDifferentParent =
        editor.item && editor.item.parentId !== request.parentId;
      const siblingCategories = categories.filter(
        (item) =>
          item.parentId === request.parentId && item.id !== editor.item?.id,
      );
      const sortOrder =
        editor.item && !movingToDifferentParent
          ? (editor.item.sortOrder ?? 0)
          : siblingCategories.reduce(
              (lastOrder, item) => Math.max(lastOrder, item.sortOrder ?? 0),
              -1,
            ) + 1;
      const categoryRequest = { ...request, sortOrder };
      if (editor.item)
        await updateCategory.mutateAsync({
          id: editor.item.id,
          request: categoryRequest,
        });
      else await createCategory.mutateAsync(categoryRequest);
      toast(t('pages.settings.tabs.product.messages.saved'));
      setEditor(null);
    } catch (error) {
      notifyError(error);
    }
  };
  const dropCategory = async (targetId: number) => {
    if (draggedCategoryId === null || draggedCategoryId === targetId) return;
    const dragged = categories.find((item) => item.id === draggedCategoryId);
    const target = categories.find((item) => item.id === targetId);
    if (!dragged || !target || dragged.parentId !== target.parentId) return;
    const siblings = categories
      .filter((item) => item.parentId === dragged.parentId)
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.name.localeCompare(b.name),
      );
    const from = siblings.findIndex((item) => item.id === dragged.id);
    const to = siblings.findIndex((item) => item.id === target.id);
    if (from < 0 || to < 0) return;
    const [moved] = siblings.splice(from, 1);
    siblings.splice(to, 0, moved);
    try {
      await reorderCategories.mutateAsync(siblings);
      toast(t('pages.settings.tabs.product.messages.reordered'));
    } catch (error) {
      notifyError(error);
    } finally {
      setDraggedCategoryId(null);
      setDropCategoryId(null);
    }
  };
  const saveAttribute = async (request: {
    code: string;
    name: string;
    valueType: ProductAttributeValueTypeValue;
    required: boolean;
    options: string[];
  }) => {
    try {
      if (editor?.type !== 'attribute') return;
      const response = editor.item
        ? await updateAttribute.mutateAsync({
            id: editor.item.id,
            request: {
              code: request.code,
              name: request.name,
              valueType: request.valueType,
              required: request.required,
            },
          })
        : await createAttribute.mutateAsync({
            code: request.code,
            name: request.name,
            valueType: request.valueType,
            required: request.required,
          });
      if (request.valueType === ProductAttributeValueType.FIXED) {
        const initialSortOrder = editor.item?.options.length ?? 0;
        for (const [index, value] of request.options.entries()) {
          await createOption.mutateAsync({
            definitionId: response.payload.id,
            request: { value, sortOrder: initialSortOrder + index },
          });
        }
      }
      setSelectedAttributeId(response.payload.id);
      toast(t('pages.settings.tabs.product.messages.saved'));
      setEditor(null);
    } catch (error) {
      notifyError(error);
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'unit')
        await deleteUnit.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === 'brand')
        await deleteBrand.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === 'category')
        await deleteCategory.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === 'attribute') {
        await deleteAttribute.mutateAsync(deleteTarget.id);
        if (selectedAttributeId === deleteTarget.id)
          setSelectedAttributeId(null);
      }
      if (deleteTarget.type === 'option' && deleteTarget.parentId) {
        await deleteOption.mutateAsync({
          definitionId: deleteTarget.parentId,
          optionId: deleteTarget.id,
        });
      }
      toast(t('pages.settings.tabs.product.messages.deleted'));
      setDeleteTarget(null);
    } catch (error) {
      notifyError(error);
    }
  };
  const saveOption = async (
    definitionId: number,
    optionId: number | null,
    value: string,
    sortOrder: number,
  ) => {
    try {
      if (optionId)
        await updateOption.mutateAsync({
          definitionId,
          optionId,
          request: { value, sortOrder },
        });
      else
        await createOption.mutateAsync({
          definitionId,
          request: { value, sortOrder },
        });
      toast(t('pages.settings.tabs.product.messages.saved'));
    } catch (error) {
      notifyError(error);
      throw error;
    }
  };

  const sectionItems = [
    {
      id: 'units' as const,
      icon: Ruler,
      label: t('pages.settings.tabs.product.sections.units'),
      count: units.length,
    },
    {
      id: 'brands' as const,
      icon: Tags,
      label: t('pages.settings.tabs.product.sections.brands'),
      count: brands.length,
    },
    {
      id: 'categories' as const,
      icon: Layers3,
      label: t('pages.settings.tabs.product.sections.categories'),
      count: categories.length,
    },
    {
      id: 'attributes' as const,
      icon: Boxes,
      label: t('pages.settings.tabs.product.sections.attributes'),
      count: attributes.length,
    },
  ];
  const currentSection = sectionItems.find((item) => item.id === section)!;
  const currentItemLabel = t(
    `pages.settings.tabs.product.entity-names.${section === 'units' ? 'unit' : section === 'brands' ? 'brand' : section === 'categories' ? 'category' : 'attribute'}`,
  );
  const currentQuery =
    section === 'units'
      ? unitsQuery
      : section === 'brands'
        ? brandsQuery
        : section === 'categories'
          ? categoriesQuery
          : attributesQuery;
  const hasError = currentQuery.isError;
  const isLoading = currentQuery.isPending;
  const filteredCount =
    section === 'units'
      ? filteredUnits.length
      : section === 'brands'
        ? filteredBrands.length
        : section === 'categories'
          ? normalizedSearch
            ? filteredCategories.length
            : categoryTree.length
          : filteredAttributes.length;

  return (
    <div className='mx-4 mb-6 space-y-5 sm:mx-6'>
      <div className='rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-800 via-zinc-800 to-zinc-900 p-5 shadow-lg sm:p-7'>
        <div className='flex flex-col justify-between gap-5 md:flex-row md:items-end'>
          <div className='max-w-2xl'>
            <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200'>
              <Boxes className='size-3.5' />{' '}
              {t('pages.settings.tabs.product.eyebrow')}
            </div>
            <h2 className='text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl'>
              {t('pages.settings.tabs.product.heading')}
            </h2>
            <p className='mt-2 text-sm leading-6 text-zinc-400'>
              {t('pages.settings.tabs.product.description')}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={openCreateEditor}
              className='bg-sky-500 text-zinc-950 hover:bg-sky-400'
            >
              <CirclePlus />{' '}
              {t('pages.settings.tabs.product.actions.add', {
                item: currentItemLabel,
              })}
            </Button>
          )}
        </div>
        <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {sectionItems.map(({ id, icon: Icon, label, count }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${section === id ? 'border-sky-400/40 bg-sky-400/10' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-800'}`}
            >
              <span
                className={`grid size-10 place-items-center rounded-lg ${section === id ? 'bg-sky-400/15 text-sky-300' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}
              >
                <Icon className='size-5' />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block text-sm font-medium text-zinc-100'>
                  {label}
                </span>
                <span className='mt-0.5 block text-xs text-zinc-500'>
                  {t('pages.settings.tabs.product.item-count', { count })}
                </span>
              </span>
              <ChevronRight
                className={`size-4 ${section === id ? 'text-sky-300' : 'text-zinc-600'}`}
              />
            </button>
          ))}
        </div>
      </div>

      <CardWrapper
        title={currentSection.label}
        description={t(
          `pages.settings.tabs.product.section-description.${section}`,
        )}
        cardExtraClass='min-h-0 bg-zinc-800/90'
        cardHeaderExtraClass='pb-4'
      >
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
          <div className='relative w-full sm:max-w-sm'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500' />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('pages.settings.tabs.product.search')}
              aria-label={t('pages.settings.tabs.product.search')}
              className={`${fieldClass} pl-9`}
            />
          </div>
          <span className='text-xs text-zinc-500'>
            {t('pages.settings.tabs.product.showing-count', {
              count: filteredCount,
            })}
          </span>
        </div>

        {isLoading ? (
          <div className='grid gap-3'>
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className='h-[68px] animate-pulse rounded-xl border border-zinc-700 bg-zinc-900/60'
              />
            ))}
          </div>
        ) : hasError ? (
          <div className='rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center'>
            <p className='text-sm text-rose-200'>
              {t('pages.settings.tabs.product.load-error')}
            </p>
            <Button
              variant='outline'
              size='sm'
              className='mt-4 border-zinc-600 text-zinc-200'
              onClick={() => void currentQuery.refetch()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : filteredCount === 0 ? (
          <div className='rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-5 py-12 text-center'>
            <div className='mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-zinc-800 text-zinc-500'>
              <currentSection.icon className='size-5' />
            </div>
            <p className='font-medium text-zinc-200'>
              {normalizedSearch
                ? t('pages.settings.tabs.product.empty-search-title')
                : t(`pages.settings.tabs.product.empty-title.${section}`)}
            </p>
            <p className='mt-1 text-sm text-zinc-500'>
              {normalizedSearch
                ? t('pages.settings.tabs.product.empty-search-description')
                : t(`pages.settings.tabs.product.empty-description.${section}`)}
            </p>
            {isAdmin && !normalizedSearch && (
              <Button
                size='sm'
                className='mt-4 bg-sky-500 text-zinc-950 hover:bg-sky-400'
                onClick={openCreateEditor}
              >
                <Plus />
                {t('pages.settings.tabs.product.actions.create-first')}
              </Button>
            )}
          </div>
        ) : section === 'units' ? (
          <div className='grid gap-2'>
            {filteredUnits.map((item) => (
              <CatalogRow
                key={item.id}
                title={item.name}
                subtitle={`${item.code} · ${item.symbol}`}
                description={t(
                  item.system
                    ? 'pages.settings.tabs.product.units.system'
                    : 'pages.settings.tabs.product.units.custom',
                )}
                icon={<Ruler className='size-4' />}
                admin={isAdmin && !item.system}
                onEdit={() => setEditor({ type: 'unit', item })}
                onDelete={() =>
                  setDeleteTarget({
                    type: 'unit',
                    id: item.id,
                    name: item.name,
                  })
                }
              />
            ))}
          </div>
        ) : section === 'brands' ? (
          <div className='grid gap-2'>
            {filteredBrands.map((item) => (
              <CatalogRow
                key={item.id}
                title={item.name}
                icon={<Tags className='size-4' />}
                admin={isAdmin}
                onEdit={() => setEditor({ type: 'brand', item })}
                onDelete={() =>
                  setDeleteTarget({
                    type: 'brand',
                    id: item.id,
                    name: item.name,
                  })
                }
              />
            ))}
          </div>
        ) : section === 'categories' ? (
          <div className='grid gap-2'>
            {categoryTree.map(({ item, depth }) => {
              const dragged = categories.find(
                (category) => category.id === draggedCategoryId,
              );
              const canDrop =
                draggedCategoryId !== null &&
                draggedCategoryId !== item.id &&
                dragged?.parentId === item.parentId;
              const hasChildren = categories.some(
                (category) => category.parentId === item.id,
              );
              const isCollapsed =
                collapsedCategoryIds.has(item.id) && !normalizedSearch;
              const disclosure = hasChildren ? (
                <button
                  type='button'
                  aria-label={t(
                    isCollapsed
                      ? 'pages.settings.tabs.product.actions.expand-category'
                      : 'pages.settings.tabs.product.actions.collapse-category',
                    { name: item.name },
                  )}
                  aria-expanded={!isCollapsed}
                  className='grid size-7 shrink-0 place-items-center rounded-md text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100'
                  onClick={() =>
                    setCollapsedCategoryIds((current) => {
                      const next = new Set(current);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                >
                  {isCollapsed ? (
                    <ChevronRight className='size-4' />
                  ) : (
                    <ChevronDown className='size-4' />
                  )}
                </button>
              ) : (
                <span className='size-7 shrink-0' />
              );
              return (
                <div
                  key={item.id}
                  onDragOver={(event) => {
                    if (canDrop) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setDropCategoryId(item.id);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void dropCategory(item.id);
                  }}
                  onDragLeave={() =>
                    dropCategoryId === item.id && setDropCategoryId(null)
                  }
                >
                  <CatalogRow
                    depth={depth}
                    dropTarget={dropCategoryId === item.id}
                    dragging={draggedCategoryId === item.id}
                    leadingAction={disclosure}
                    title={item.name}
                    subtitle={item.code}
                    description={item.description ?? undefined}
                    icon={<Layers3 className='size-4' />}
                    admin={isAdmin}
                    dragHandle={
                      isAdmin ? (
                        <button
                          type='button'
                          draggable
                          aria-label={t(
                            'pages.settings.tabs.product.actions.drag-category',
                            { name: item.name },
                          )}
                          title={t(
                            'pages.settings.tabs.product.actions.drag-category',
                            { name: item.name },
                          )}
                          className='grid size-8 cursor-grab place-items-center rounded-md text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100 active:cursor-grabbing'
                          onDragStart={(event) => {
                            const row =
                              event.currentTarget.closest<HTMLElement>(
                                '[data-category-row]',
                              );
                            if (row) {
                              const bounds = row.getBoundingClientRect();
                              event.dataTransfer.setDragImage(
                                row,
                                event.clientX - bounds.left,
                                event.clientY - bounds.top,
                              );
                            }
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData(
                              'text/plain',
                              String(item.id),
                            );
                            setDraggedCategoryId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggedCategoryId(null);
                            setDropCategoryId(null);
                          }}
                        >
                          <GripVertical className='size-4' />
                        </button>
                      ) : undefined
                    }
                    onEdit={() => setEditor({ type: 'category', item })}
                    onDelete={() =>
                      setDeleteTarget({
                        type: 'category',
                        id: item.id,
                        name: item.name,
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className='grid gap-2'>
            {filteredAttributes.map((item) => (
              <CatalogRow
                key={item.id}
                title={item.name}
                subtitle={`${item.code} · ${t(`pages.settings.tabs.product.value-types.${item.valueType}`)}`}
                description={
                  item.required
                    ? t('pages.settings.tabs.product.required')
                    : undefined
                }
                icon={<Boxes className='size-4' />}
                admin={isAdmin}
                selected={selectedAttributeId === item.id}
                onSelect={() =>
                  setSelectedAttributeId(
                    selectedAttributeId === item.id ? null : item.id,
                  )
                }
                onEdit={() => setEditor({ type: 'attribute', item })}
                onDelete={() =>
                  setDeleteTarget({
                    type: 'attribute',
                    id: item.id,
                    name: item.name,
                  })
                }
              />
            ))}
          </div>
        )}
        {section === 'attributes' && selectedAttribute && (
          <AttributeOptionsPanel
            attribute={selectedAttribute}
            admin={isAdmin}
            onSave={saveOption}
            onDelete={(option) =>
              setDeleteTarget({
                type: 'option',
                id: option.id,
                parentId: selectedAttribute.id,
                name: option.value,
              })
            }
          />
        )}
      </CardWrapper>

      {editor?.type === 'unit' && (
        <UnitEditor
          key={`unit-${editor.item?.id ?? 'new'}`}
          open
          item={editor.item}
          pending={createUnit.isPending || updateUnit.isPending}
          onOpenChange={(open) => !open && setEditor(null)}
          onSave={saveUnit}
        />
      )}
      {editor?.type === 'brand' && (
        <BrandEditor
          key={`brand-${editor.item?.id ?? 'new'}`}
          open
          item={editor.item}
          pending={createBrand.isPending || updateBrand.isPending}
          onOpenChange={(open) => !open && setEditor(null)}
          onSave={saveBrand}
        />
      )}
      {editor?.type === 'category' && (
        <CategoryEditor
          key={`category-${editor.item?.id ?? 'new'}`}
          open
          item={editor.item}
          categories={categories}
          pending={createCategory.isPending || updateCategory.isPending}
          onOpenChange={(open) => !open && setEditor(null)}
          onSave={saveCategory}
        />
      )}
      {editor?.type === 'attribute' && (
        <AttributeEditor
          key={`attribute-${editor.item?.id ?? 'new'}`}
          open
          item={editor.item}
          pending={
            createAttribute.isPending ||
            updateAttribute.isPending ||
            createOption.isPending
          }
          onOpenChange={(open) => !open && setEditor(null)}
          onSave={saveAttribute}
        />
      )}
      <ProductCatalogDeleteDialog
        target={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        pending={
          deleteUnit.isPending ||
          deleteBrand.isPending ||
          deleteCategory.isPending ||
          deleteAttribute.isPending ||
          deleteOption.isPending
        }
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
