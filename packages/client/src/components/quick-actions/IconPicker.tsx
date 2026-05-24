// React / library
import { useState, useMemo } from 'react';
import {
  Check,
  ChevronsUpDown,
  // Curated icon set for quick actions
  Bug,
  CheckCircle,
  Code,
  Cog,
  FileText,
  FolderSync,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Hammer,
  Layers,
  MessageSquare,
  Package,
  Pencil,
  Play,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Shield,
  Sparkles,
  Terminal,
  TestTube,
  Upload,
  Wand2,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Lib
import { cn } from '@/lib/utils';

type IconEntry = { name: string; icon: LucideIcon };

const ICONS: IconEntry[] = [
  { name: 'Bug', icon: Bug },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'Code', icon: Code },
  { name: 'Cog', icon: Cog },
  { name: 'FileText', icon: FileText },
  { name: 'FolderSync', icon: FolderSync },
  { name: 'GitBranch', icon: GitBranch },
  { name: 'GitCommit', icon: GitCommit },
  { name: 'GitMerge', icon: GitMerge },
  { name: 'GitPullRequest', icon: GitPullRequest },
  { name: 'Hammer', icon: Hammer },
  { name: 'Layers', icon: Layers },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'Package', icon: Package },
  { name: 'Pencil', icon: Pencil },
  { name: 'Play', icon: Play },
  { name: 'RefreshCw', icon: RefreshCw },
  { name: 'Rocket', icon: Rocket },
  { name: 'Search', icon: Search },
  { name: 'Send', icon: Send },
  { name: 'Shield', icon: Shield },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Terminal', icon: Terminal },
  { name: 'TestTube', icon: TestTube },
  { name: 'Upload', icon: Upload },
  { name: 'Wand2', icon: Wand2 },
  { name: 'Wrench', icon: Wrench },
  { name: 'Zap', icon: Zap },
];

/** Map icon name -> component for lookups */
const ICON_MAP = new Map(ICONS.map((e) => [e.name, e.icon]));

/** Resolve an icon name to a Lucide component. Returns Zap as fallback. */
export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Zap;
  return ICON_MAP.get(name) ?? Zap;
}

interface IconPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return ICONS;
    const q = search.toLowerCase();
    return ICONS.filter((e) => e.name.toLowerCase().includes(q));
  }, [search]);

  const SelectedIcon = value ? (ICON_MAP.get(value) ?? null) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
          size="sm"
        >
          <span className="flex items-center gap-2 truncate">
            {SelectedIcon && <SelectedIcon className="h-4 w-4 shrink-0" />}
            {value ?? 'Select icon...'}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search icons..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No icons found.</CommandEmpty>
            <CommandGroup>
              {/* None option */}
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setSearch('');
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 h-3.5 w-3.5 shrink-0', !value ? 'opacity-100' : 'opacity-0')} />
                <span className="text-muted-foreground">None</span>
              </CommandItem>
              {filtered.map((entry) => (
                <CommandItem
                  key={entry.name}
                  value={entry.name}
                  onSelect={() => {
                    onChange(entry.name === value ? null : entry.name);
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-3.5 w-3.5 shrink-0', value === entry.name ? 'opacity-100' : 'opacity-0')}
                  />
                  <entry.icon className="mr-2 h-4 w-4 shrink-0" />
                  <span>{entry.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
