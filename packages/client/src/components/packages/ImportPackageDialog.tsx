// React / library
import { AtlasPackageSchema } from '@atlas/shared';
import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReviewStep } from './ReviewStep';
import { UploadStep } from './UploadStep';

// Hooks
import { useApplyImportPackage, usePreviewImportPackage } from '@/hooks/use-packages.hook';

// Types
import type { AtlasPackage, ImportPreview } from '@atlas/shared';
import type { ImportPackageDialogProps, Resolutions } from './packages.types';

type Step = 'upload' | 'review';

function buildInitialResolutions(data: ImportPreview): Resolutions {
  return data.items.map((item) => ({
    name: item.name,
    action: item.action,
    renamedTo: item.renamedTo,
  }));
}

export function ImportPackageDialog({ open, onOpenChange, projectId }: ImportPackageDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [pkg, setPkg] = useState<AtlasPackage | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Resolutions>([]);

  const previewMutation = usePreviewImportPackage();
  const importMutation = useApplyImportPackage();

  const reset = useCallback(() => {
    setStep('upload');
    setPkg(null);
    setPreview(null);
    setParseError(null);
    setResolutions([]);
    previewMutation.reset();
    importMutation.reset();
  }, [previewMutation, importMutation]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset();
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setParseError(null);
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const parsed = AtlasPackageSchema.parse(json);
        setPkg(parsed);
        previewMutation.mutate(parsed, {
          onSuccess: (data) => {
            setPreview(data);
            setResolutions(buildInitialResolutions(data));
            setStep('review');
          },
        });
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Invalid package file');
      }
    },
    [previewMutation],
  );

  const handleImport = useCallback(() => {
    if (!pkg) return;
    importMutation.mutate({ package: pkg, resolutions, projectId }, { onSuccess: () => handleOpenChange(false) });
  }, [pkg, resolutions, projectId, importMutation, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === 'upload' ? 'Import Package' : 'Review Import'}</DialogTitle>
          <DialogDescription>
            {step === 'upload'
              ? 'Import a JSON package containing agents, skills, rules, or a collection.'
              : 'Review what will be imported and resolve any conflicts.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <UploadStep
            onFileSelect={handleFileSelect}
            parseError={parseError}
            isPreviewing={previewMutation.isPending}
            previewError={previewMutation.error as Error | null}
          />
        )}

        {step === 'review' && preview && pkg && (
          <ReviewStep
            pkg={pkg}
            preview={preview}
            resolutions={resolutions}
            onResolutionAtIndexChange={(index, r) =>
              setResolutions((prev) => {
                const next = [...prev];
                next[index] = r;
                return next;
              })
            }
          />
        )}

        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importMutation.isPending}>
                <Upload className="mr-1.5 h-4 w-4" />
                {importMutation.isPending ? 'Importing...' : 'Import'}
              </Button>
            </>
          )}
          {importMutation.error && (
            <p className="w-full text-sm text-destructive">{(importMutation.error as Error).message}</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
