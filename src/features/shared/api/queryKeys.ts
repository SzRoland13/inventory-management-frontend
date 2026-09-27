export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  company: {
    all: ['company'] as const,
    minimal: ['company', 'minimal'] as const,
    extended: ['company', 'extended'] as const,
  },
  currencies: {
    all: ['currencies'] as const,
  },
  documentPrefixes: {
    all: ['document-prefixes'] as const,
  },
  media: {
    all: ['media'] as const,
    preview: (id: number) => ['media', 'preview', id] as const,
  },
  users: {
    all: ['users'] as const,
  },
  brands: {
    all: ['brands'] as const,
    list: (query: string) => ['brands', 'list', query] as const,
  },
  products: {
    all: ['products'] as const,
    lists: () => ['products', 'list'] as const,
    list: (params: unknown) => ['products', 'list', params] as const,
    detail: (id: number) => ['products', 'detail', id] as const,
    archivedLists: () => ['products', 'archived-list'] as const,
    archivedList: (params: unknown) =>
      ['products', 'archived-list', params] as const,
    lookups: {
      units: ['product-lookups', 'units'] as const,
      categories: ['product-lookups', 'categories'] as const,
      attributes: ['product-lookups', 'attributes'] as const,
    },
  },
};
