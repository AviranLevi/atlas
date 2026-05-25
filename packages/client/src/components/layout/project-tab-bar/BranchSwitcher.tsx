// React / library
import { ArrowDownToLine, Check, GitBranch, Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

// Components
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Hooks
import {
  useCheckoutBranch,
  useCreateBranch,
  useGitPull,
  useGitStatus,
  useProjectBranches,
} from '@/hooks/use-projects.hook';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { Project } from '@atlas/shared';

type BranchSwitcherProps = {
  project: Project;
};

export function BranchSwitcher({ project }: BranchSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: gitStatus } = useGitStatus(project.id, !!project.localPath);
  const { data: branches = [], isLoading: branchesLoading } = useProjectBranches(open ? project.id : undefined);
  const checkout = useCheckoutBranch(project.id);
  const createBranch = useCreateBranch(project.id);
  const gitPull = useGitPull();

  const currentBranch = gitStatus?.currentBranch ?? null;

  // Filter out agent worktree branches and sort: current first, then default, then alpha
  const sorted = useMemo(() => {
    const filtered = branches.filter((b) => !b.startsWith('agents/'));
    return filtered.sort((a, b) => {
      if (a === currentBranch) return -1;
      if (b === currentBranch) return 1;
      if (a === project.defaultBranch) return -1;
      if (b === project.defaultBranch) return 1;
      return a.localeCompare(b);
    });
  }, [branches, currentBranch, project.defaultBranch]);

  const canCreate = search.trim().length > 0 && !branches.includes(search.trim());

  const handleCheckout = (branch: string) => {
    if (branch === currentBranch) return;
    checkout.mutate(branch, { onSuccess: () => setOpen(false) });
  };

  const handleCreate = () => {
    const name = search.trim();
    if (!name) return;
    createBranch.mutate(
      { name, baseBranch: currentBranch ?? undefined },
      {
        onSuccess: (data) => {
          setSearch('');
          checkout.mutate(data.branch, { onSuccess: () => setOpen(false) });
        },
      },
    );
  };

  if (!currentBranch) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitBranch className="h-3 w-3" />
              <span className="max-w-[160px] truncate">{currentBranch}</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {currentBranch !== project.defaultBranch
            ? `Currently on ${currentBranch} (default: ${project.defaultBranch ?? 'main'})`
            : 'On default branch'}
        </TooltipContent>
      </Tooltip>

      <PopoverContent side="bottom" align="end" className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Find or create branch..." value={search} onValueChange={setSearch} />
          <CommandList>
            {branchesLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <>
                <CommandEmpty>No branches found.</CommandEmpty>

                <CommandGroup>
                  {sorted
                    .filter((b) => !search || b.toLowerCase().includes(search.toLowerCase()))
                    .map((branch) => (
                      <CommandItem
                        key={branch}
                        value={branch}
                        onSelect={() => handleCheckout(branch)}
                        disabled={checkout.isPending}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Check
                          className={cn('h-3 w-3 shrink-0', branch === currentBranch ? 'opacity-100' : 'opacity-0')}
                        />
                        <span className="truncate">{branch}</span>
                        {branch === project.defaultBranch && (
                          <span className="ml-auto text-[10px] text-muted-foreground">default</span>
                        )}
                      </CommandItem>
                    ))}
                </CommandGroup>

                {canCreate && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreate}
                      disabled={createBranch.isPending}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Plus className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        Create <span className="font-medium">{search.trim()}</span> from {currentBranch}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>

        <div className="border-t p-1.5">
          <button
            type="button"
            onClick={() => gitPull.mutate(project.id)}
            disabled={gitPull.isPending}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            <ArrowDownToLine className={cn('h-3 w-3', gitPull.isPending && 'animate-bounce')} />
            {gitPull.isPending ? 'Pulling...' : `Pull origin/${project.defaultBranch ?? 'main'}`}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
