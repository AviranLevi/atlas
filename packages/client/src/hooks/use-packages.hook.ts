// React / library
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    onSuccess: () => toast.success('Skill exported'),
    onError: (e) => toast.error(`Failed to export skill: ${e instanceof Error ? e.message : 'Unknown error'}`),
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
    onSuccess: () => toast.success('Rule exported'),
    onError: (e) => toast.error(`Failed to export rule: ${e instanceof Error ? e.message : 'Unknown error'}`),
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
    onSuccess: () => toast.success('Agent exported'),
    onError: (e) => toast.error(`Failed to export agent: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Previews importing an Atlas Package — returns conflict information. */
export function usePreviewImportPackage() {
  return useMutation({
    mutationFn: (pkg: AtlasPackage) => api.post<ImportPreview>('/packages/import/preview', pkg),
    onError: (e) => toast.error(`Failed to preview import: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Applies an import with resolved conflicts. */
export function useApplyImportPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportRequest) => api.post<ImportSummary>('/packages/import/apply', data),
    onSuccess: () => {
      toast.success('Package imported');
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['rules'] });
    },
    onError: (e) => toast.error(`Failed to import package: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
