import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requireSuccessfulResponse } from '@/features/shared/api/apiResponse';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { PartnerService } from '@/features/partners/services/PartnerService';
import type {
  ContactRequest,
  PartnerRequest,
} from '@/features/partners/types/partner';

export function usePartnersQuery() {
  return useQuery({
    queryKey: queryKeys.partners.all,
    queryFn: () => requireSuccessfulResponse(PartnerService.list()),
  });
}

function useInvalidatePartners() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.partners.all });
}

export function useCreatePartnerMutation() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: (request: PartnerRequest) =>
      requireSuccessfulResponse(PartnerService.create(request)),
    onSuccess: invalidate,
  });
}

export function useUpdatePartnerMutation() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: PartnerRequest }) =>
      requireSuccessfulResponse(PartnerService.update(id, request)),
    onSuccess: invalidate,
  });
}

export function useSetPartnerArchivedMutation() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) =>
      requireSuccessfulResponse(
        archived ? PartnerService.archive(id) : PartnerService.restore(id),
      ),
    onSuccess: invalidate,
  });
}

export function useSaveContactMutation() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: ({
      partnerId,
      contactId,
      request,
    }: {
      partnerId: number;
      contactId?: number;
      request: ContactRequest;
    }) =>
      requireSuccessfulResponse(
        contactId
          ? PartnerService.updateContact(partnerId, contactId, request)
          : PartnerService.createContact(partnerId, request),
      ),
    onSuccess: invalidate,
  });
}

export function useRemoveContactMutation() {
  const invalidate = useInvalidatePartners();
  return useMutation({
    mutationFn: ({ partnerId, contactId }: { partnerId: number; contactId: number }) =>
      requireSuccessfulResponse(PartnerService.removeContact(partnerId, contactId)),
    onSuccess: invalidate,
  });
}
