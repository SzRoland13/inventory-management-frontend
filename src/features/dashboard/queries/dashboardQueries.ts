import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/features/shared/api/queryKeys';
import { DashboardService } from '@/features/dashboard/services/DashboardService';
import { buildDashboardViewModel } from '@/features/dashboard/helpers/dashboardData';
import type { DashboardDateRange } from '@/features/dashboard/types/dashboard';

export function useDashboardQuery(range: DashboardDateRange) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, range.startDate, range.endDate],
    queryFn: () => DashboardService.getSnapshot(range),
    select: (source) => buildDashboardViewModel(source, range),
    staleTime: 30_000,
  });
}
