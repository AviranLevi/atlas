// React / library
import { ArrowUp, ChevronRight, Folder, FolderGit2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// Hooks
import { useBrowseFilesystem } from '@/hooks/use-projects.hook';

// Types
import type { FolderPickerDialogProps } from './projects.types';

export function FolderPickerDialog({ open, onOpenChange, initialPath, onSelect }: FolderPickerDialogProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [manualInput, setManualInput] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (open) {
      setCurrentPath(initialPath || '');
      setManualInput('');
      setFilter('');
    }
  }, [open, initialPath]);

  const { data, isLoading } = useBrowseFilesystem(currentPath, open);

  const handleNavigate = (dirPath: string) => {
    setCurrentPath(dirPath);
    setFilter('');
  };

  const filteredDirs = useMemo(() => {
    if (!data?.directories) return [];
    if (!filter.trim()) return data.directories;
    const q = filter.toLowerCase();
    return data.directories.filter((d) => d.name.toLowerCase().includes(q));
  }, [data?.directories, filter]);

  const handleGoUp = () => {
    if (data?.parentPath) {
      setCurrentPath(data.parentPath);
    }
  };

  const handleManualNavigate = () => {
    if (manualInput.trim()) {
      setCurrentPath(manualInput.trim());
      setManualInput('');
    }
  };

  const handleSelect = () => {
    if (data?.currentPath) {
      onSelect(data.currentPath);
      onOpenChange(false);
    }
  };

  const pathSegments = data?.currentPath.split('/').filter(Boolean) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Folder</DialogTitle>
          <DialogDescription>Choose the local git repository for this project.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type a path and press Go..."
            onKeyDown={(e) => e.key === 'Enter' && handleManualNavigate()}
            className="text-xs"
          />
          <Button variant="outline" size="sm" asChild>
            <button type="button" onClick={handleManualNavigate}>
              Go
            </button>
          </Button>
        </div>

        {data && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto py-1">
            <button onClick={() => setCurrentPath('/')} className="hover:text-foreground shrink-0">
              /
            </button>
            {pathSegments.map((segment, i) => {
              const segmentPath = `/${pathSegments.slice(0, i + 1).join('/')}`;
              return (
                <span key={segmentPath} className="flex items-center gap-1 shrink-0">
                  <ChevronRight className="h-3 w-3" />
                  <button onClick={() => setCurrentPath(segmentPath)} className="hover:text-foreground hover:underline">
                    {segment}
                  </button>
                </span>
              );
            })}
            {data.isGitRepo && (
              <Badge variant="secondary" className="ml-2 text-[10px] shrink-0">
                git repo
              </Badge>
            )}
          </div>
        )}

        {data && data.directories.length > 6 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter folders..."
              className="pl-8 text-xs h-8"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto border rounded-md min-h-[200px] max-h-[360px]">
          {data?.parentPath && !filter && (
            <button
              onClick={handleGoUp}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 border-b text-muted-foreground"
            >
              <ArrowUp className="h-4 w-4" />
              ..
            </button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          )}

          {!isLoading && filteredDirs.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">{filter ? 'No matching folders' : 'No subdirectories'}</p>
            </div>
          )}

          {filteredDirs.map((dir) => (
            <button
              key={dir.path}
              onClick={() => handleNavigate(dir.path)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-b-0"
            >
              {dir.isGitRepo ? (
                <FolderGit2 className="h-4 w-4 text-orange-500 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="truncate text-left">{dir.name}</span>
              {dir.isGitRepo && (
                <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">
                  git
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-muted-foreground text-[11px] truncate max-w-[300px]">{data?.currentPath ?? ''}</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" asChild>
              <button type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
            </Button>
            <Button asChild>
              <button type="button" onClick={handleSelect}>
                Select This Folder
              </button>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
