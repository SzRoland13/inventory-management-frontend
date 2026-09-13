import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentPrefixService } from '@/lib/services/DocumentPrefixService';
import { requireSuccessfulResponse } from '@/lib/queries/apiResponse';
import { queryKeys } from '@/lib/queries/queryKeys';

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
