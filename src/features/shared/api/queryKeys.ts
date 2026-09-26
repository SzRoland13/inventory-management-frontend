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
};
