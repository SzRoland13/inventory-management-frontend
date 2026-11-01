'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ProductService } from '@/features/products/services/ProductService';
import type { ProductResponse } from '@/features/products/types/product';
import { queryKeys } from '@/features/shared/api/queryKeys';
import type { DocumentLine } from '@/features/documents/types/documents';

export function useDocumentLineUnitResolver() {
  const queryClient = useQueryClient();

  return async (line: DocumentLine): Promise<number | null> => {
    if (line.unitId != null) return line.unitId;

    const product = await queryClient.query<ProductResponse>({
      queryKey: queryKeys.products.detail(line.productId),
      staleTime: 'static',
      queryFn: async () => {
        const response = await ProductService.get(line.productId);
        if (!response.success || !response.payload) throw new Error(response.messageKey);
        return response.payload;
      },
    });

    const unitName = line.unitName.trim().toLocaleLowerCase();
    const matchingUnit = [product.units.main, product.units.secondary].find(
      (unit) => unit?.name.trim().toLocaleLowerCase() === unitName,
    );
    return matchingUnit?.id ?? null;
  };
}
