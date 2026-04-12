// React / library
import { Button } from '@/components/ui/button';

// Types
import type { PackageType } from '@atlas/shared';

type MarketplaceFiltersProps = {
  type: PackageType | undefined;
  onTypeChange: (type: PackageType | undefined) => void;
};

const FILTER_OPTIONS: { label: string; value: PackageType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Skills', value: 'skill' },
  { label: 'Rules', value: 'rule' },
  { label: 'Agents', value: 'agent' },
  { label: 'Collections', value: 'collection' },
];

export function MarketplaceFilters({ type, onTypeChange }: MarketplaceFiltersProps) {
  return (
    <div className="flex gap-2">
      {FILTER_OPTIONS.map((opt) => (
        <Button
          key={opt.label}
          variant={type === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
