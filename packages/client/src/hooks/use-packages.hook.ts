// React / library
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { AtlasPackage, ImportRequest } from '@atlas/shared';

type ImportPreview = {
  agent: { data: unknown; conflict: { id: string; name: string } | null } | null;
  skills: { data: unknown; conflict: { id: string; name: string } | null }[];
  rules: { data: unknown; conflict: { id: string; name: string } | null }[];
  providerHint: {
    hint: { type: string; model: string };
    matchedProvider: { id: string; name: string } | null;
  } | null;
};

type ImportSummary = {
  agentId: string | null;
  skillIds: string[];
  ruleIds: string[];
};

export function useImportPreview() {
  return useMutation({
    mutationFn: (pkg: AtlasPackage) => api.post<ImportPreview>('/packages/import/preview', pkg),
  });
}

export function useImportPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ImportRequest) => api.post<ImportSummary>('/packages/import', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
