// React / library
import { GitBranch } from 'lucide-react';

// Components
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
import type { BranchSelectProps } from './workspaces.types';

// Constants
import { DEFAULT_BRANCH_VALUE } from './workspaces.constants';

export function BranchSelect({ branches, isLoading, value, onChange, defaultLabel }: BranchSelectProps) {
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
          </SelectContent>
        </Select>
      )}
      <p className="text-muted-foreground text-xs">
        The worktree will branch off from this base.
      </p>
    </div>
  );
}
