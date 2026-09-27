import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/features/shared/components/ui/checkbox';
import type { ProductCategory } from '@/features/products/types/product';

type CategoryTreeNode = {
  category: ProductCategory;
  children: CategoryTreeNode[];
};

export function CategoryPicker({
  categories,
  selectedIds,
  onChange,
}: {
  categories: ProductCategory[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const t = useTranslations();
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const selected = new Set(selectedIds);

  const toggleCategory = (categoryId: number, checked: boolean) => {
    const value = String(categoryId);
    onChange(
      checked
        ? [...selectedIds, value]
        : selectedIds.filter((selectedId) => selectedId !== value),
    );
  };

  return (
    <div className='rounded-xl border border-zinc-700/80 bg-zinc-900/35 p-3 sm:p-4'>
      <div className='mb-3 flex items-center justify-between gap-3 px-1'>
        <p className='text-xs text-zinc-400'>
          {t('pages.products.dialog.category-picker.selected-count', {
            count: selectedIds.length,
          })}
        </p>
      </div>
      <div className='max-h-64 space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {tree.map((node) => (
          <CategoryPickerNode
            key={node.category.id}
            node={node}
            depth={0}
            selected={selected}
            onToggle={toggleCategory}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryPickerNode({
  node,
  depth,
  selected,
  onToggle,
}: {
  node: CategoryTreeNode;
  depth: number;
  selected: Set<string>;
  onToggle: (categoryId: number, checked: boolean) => void;
}) {
  const { category } = node;
  const checked = selected.has(String(category.id));

  return (
    <div>
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
          checked
            ? 'border-sky-400/40 bg-sky-400/[0.07]'
            : 'border-zinc-700/80 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
        }`}
      >
        <Checkbox
          name={`category-${category.id}`}
          checked={checked}
          onCheckedChange={(nextChecked) =>
            onToggle(category.id, nextChecked === true)
          }
          className='mt-0.5 border-zinc-500 data-[state=checked]:border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:text-zinc-950'
        />
        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-medium leading-5 text-zinc-100'>
            {category.name}
          </span>
          <span className='mt-0.5 block truncate text-xs text-zinc-500'>
            {category.code}
            {category.description ? ` · ${category.description}` : ''}
          </span>
        </span>
      </label>
      {node.children.length > 0 && (
        <div
          className={`ml-4 mt-2 space-y-2 border-l border-zinc-700/80 pl-3 sm:ml-5 sm:pl-4 ${
            depth > 0 ? 'border-l-sky-400/20' : ''
          }`}
        >
          {node.children.map((child) => (
            <CategoryPickerNode
              key={child.category.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildCategoryTree(categories: ProductCategory[]): CategoryTreeNode[] {
  const nodes = new Map<number, CategoryTreeNode>(
    categories.map((category) => [category.id, { category, children: [] }]),
  );
  const roots: CategoryTreeNode[] = [];

  for (const node of nodes.values()) {
    const parent =
      node.category.parentId === null
        ? undefined
        : nodes.get(node.category.parentId);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortTree = (siblings: CategoryTreeNode[]) => {
    siblings.sort(
      (a, b) =>
        (a.category.sortOrder ?? 0) - (b.category.sortOrder ?? 0) ||
        a.category.name.localeCompare(b.category.name),
    );
    siblings.forEach((node) => sortTree(node.children));
  };
  sortTree(roots);
  return roots;
}
