// React / library
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';
import { downloadJson } from '@/lib/file-utils';

// Types
import type { AtlasPackage, ImportPreview, ImportRequest, ImportSummary } from '@atlas/shared';

/** Exports a skill as an Atlas Package and downloads it. */
export function useExportSkillPackage() {
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const pkg = await api.get<AtlasPackage>(`/packages/export/skill/${id}`);
      downloadJson(pkg, `${name}.atlas.json`);
      return pkg;
    },
  });
}

/** Exports a rule as an Atlas Package and downloads it. */
export function useExportRulePackage() {
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const pkg = await api.get<AtlasPackage>(`/packages/export/rule/${id}`);
      downloadJson(pkg, `${name}.atlas.json`);
      return pkg;
    },
  });
}

/** Exports an agent as an Atlas Package and downloads it. */
export function useExportAgentPackage() {
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const pkg = await api.get<AtlasPackage>(`/packages/export/agent/${id}`);
      downloadJson(pkg, `${name}.atlas.json`);
      return pkg;
    },
  });
}

/** Previews importing an Atlas Package — returns conflict information. */
export function usePreviewImportPackage() {
  return useMutation({
    mutationFn: (pkg: AtlasPackage) => api.post<ImportPreview>('/packages/import/preview', pkg),
  });
}

/** Applies an import with resolved conflicts. */
export function useApplyImportPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportRequest) => api.post<ImportSummary>('/packages/import/apply', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
