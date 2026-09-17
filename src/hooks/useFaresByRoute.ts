// src/hooks/useFaresByRoute.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import fareService, { RouteGroupedFare, UpdateFareData } from '../services/fareService';
import { ServiceCategory } from '../types';
import type { CreateFareData } from '../services/fareService';

interface UseFaresByRouteParams {
  company_id: number;
  service_category?: ServiceCategory;
  route_id?: number;
  only_active_routes?: boolean;
}

export const useFaresByRoute = (params: UseFaresByRouteParams) => {
  const queryClient = useQueryClient();

  const {
    data: routeGroupedFares = [],
    isLoading,
    error,
    refetch
  } = useQuery<RouteGroupedFare[], Error>({
    queryKey: ['fares-by-route', params],
    queryFn: () => fareService.getFaresByRouteGrouped({
      ...params,
      skip: 0,
      limit: 100
    }),
    enabled: !!params.company_id,
  });

  const updateFareMutation = useMutation({
    mutationFn: ({ fareId, data }: { fareId: number; data: UpdateFareData }) =>
      fareService.updateFare(fareId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fares-by-route'] });
    },
  });

  const createFareMutation = useMutation({
    mutationFn: (data: CreateFareData) => fareService.createFare(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fares-by-route'] });
    },
  });

  return {
    routeGroupedFares,
    isLoading,
    error: error?.message,
    refetch,
    updateFare: updateFareMutation.mutateAsync,
    createFare: createFareMutation.mutateAsync,
    isUpdating: updateFareMutation.isPending,
    isCreating: createFareMutation.isPending,
  };
};
