import type { AtlasPackage, ImportResolution } from '@atlas/shared';

export type ImportPackageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ImportPreviewData = {
  agent: { data: unknown; conflict: { id: string; name: string } | null } | null;
  skills: { data: unknown; conflict: { id: string; name: string } | null }[];
  rules: { data: unknown; conflict: { id: string; name: string } | null }[];
  providerHint: {
    hint: { type: string; model: string };
    matchedProvider: { id: string; name: string } | null;
  } | null;
};

export type Resolutions = {
  agent?: ImportResolution;
  skills: Record<string, ImportResolution>;
  rules: Record<string, ImportResolution>;
  providerId?: string | null;
};
