// React / library
import type { ReactElement } from 'react';
import { GitBranch, Plus, Loader2 } from 'lucide-react';

// Components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
import type { BranchSelectProps } from './workspaces.types';

// Constants
import { DEFAULT_BRANCH_VALUE, NEW_BRANCH_VALUE } from './workspaces.constants';

export function BranchSelect({
  branches,
  isLoading,
  value,
  onChange,
  defaultLabel,
  newBranchName,
  onNewBranchNameChange,
  isCreating,
  createError,
}: BranchSelectProps): ReactElement {
  const isNew = value === NEW_BRANCH_VALUE;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <GitBranch className="h-3.5 w-3.5" />
        Base Branch
      </Label>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading branches...</p>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_BRANCH_VALUE}>
              <span className="text-muted-foreground">Default ({defaultLabel})</span>
            </SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch} value={branch}>{branch}</SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value={NEW_BRANCH_VALUE}>
              <span className="flex items-center gap-1.5">
                <Plus className="h-3 w-3" />
                Create new branch...
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
      {isNew && (
        <div className="space-y-1.5">
          <Input
            placeholder="feature/my-branch"
            value={newBranchName}
            onChange={(e) => onNewBranchNameChange?.(e.target.value)}
            autoFocus
            disabled={isCreating}
          />
          {isCreating && (
            <p className="text-muted-foreground text-xs flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Creating branch...
            </p>
          )}
          {createError && (
            <p className="text-destructive text-xs">{createError}</p>
          )}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        {isNew
          ? 'A new branch will be created from the default branch before starting work.'
          : 'The worktree will branch off from this base.'}
      </p>
    </div>
  );
}
