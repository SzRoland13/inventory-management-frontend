export enum ProductCatalogSection {
  Units = 'units',
  Brands = 'brands',
  Categories = 'categories',
  Attributes = 'attributes',
}

export function isProductCatalogSection(
  value: string | null,
): value is ProductCatalogSection {
  return Object.values(ProductCatalogSection).some(
    (section) => section === value,
  );
}
