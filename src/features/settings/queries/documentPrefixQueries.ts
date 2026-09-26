import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentPrefixService } from '@/features/settings/services/DocumentPrefixService';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';

export function useDocumentPrefixesQuery() {
  return useQuery({
    queryKey: queryKeys.documentPrefixes.all,
    queryFn: () => requireSuccessfulResponse(DocumentPrefixService.getAll()),
  });
}

export function useUpdateDocumentPrefixesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      request: Parameters<typeof DocumentPrefixService.updateAll>[0],
    ) => requireSuccessfulResponse(DocumentPrefixService.updateAll(request)),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.documentPrefixes.all, response);
    },
  });
}
