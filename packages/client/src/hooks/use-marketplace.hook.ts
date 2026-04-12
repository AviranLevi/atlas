// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { ImportSummary, MarketplaceListing, MarketplaceSearchResult } from '@atlas/shared';

const MARKETPLACE_KEY = ['marketplace'] as const;

/** Searches the marketplace registry. Results are cached for 60 seconds. */
export function useMarketplaceSearch(params: { q?: string; type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...MARKETPLACE_KEY, params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.type) qs.set('type', params.type);
      if (params.page) qs.set('page', String(params.page));
      if (params.limit) qs.set('limit', String(params.limit));
      return api.get<MarketplaceSearchResult>(`/marketplace/search?${qs.toString()}`);
    },
    staleTime: 60_000,
    enabled: !!params.q || !!params.type,
  });
}

/** Installs a package from the marketplace into Atlas. */
export function useInstallPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listing: MarketplaceListing; projectId?: string }) =>
      api.post<ImportSummary>('/marketplace/install', { ...data.listing, projectId: data.projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
