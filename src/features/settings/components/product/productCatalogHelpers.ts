import type { ProductCategory } from '@/features/products/types/product';

export function buildCategoryTree(
  categories: ProductCategory[],
  search: string,
  collapsedIds: Set<number>,
): Array<{ item: ProductCategory; depth: number }> {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const visibleIds = new Set(
    categories
      .filter(
        (category) =>
          !search ||
          `${category.name} ${category.code} ${category.description ?? ''}`
            .toLocaleLowerCase()
            .includes(search),
      )
      .map((category) => category.id),
  );
  for (const id of [...visibleIds]) {
    let parentId = byId.get(id)?.parentId ?? null;
    const ancestors = new Set<number>();
    while (parentId !== null && !ancestors.has(parentId)) {
      ancestors.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) break;
      visibleIds.add(parentId);
      parentId = parent.parentId;
    }
  }

  const children = new Map<number | null, ProductCategory[]>();
  for (const category of categories) {
    if (!visibleIds.has(category.id)) continue;
    const parentId =
      category.parentId !== null && visibleIds.has(category.parentId)
        ? category.parentId
        : null;
    children.set(parentId, [...(children.get(parentId) ?? []), category]);
  }
  const sortSiblings = (items: ProductCategory[]) =>
    items.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );
  const result: Array<{ item: ProductCategory; depth: number }> = [];
  const visited = new Set<number>();
  const visit = (items: ProductCategory[], depth: number) => {
    for (const item of sortSiblings(items)) {
      if (visited.has(item.id)) continue;
      visited.add(item.id);
      result.push({ item, depth });
      if (!search && collapsedIds.has(item.id)) continue;
      visit(children.get(item.id) ?? [], depth + 1);
    }
  };
  visit(children.get(null) ?? [], 0);
  return result;
}
