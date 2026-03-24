// React / library
import { useState, useMemo, useCallback } from 'react';
import { Cpu, Pencil, X, Check, Loader2 } from 'lucide-react';

// Components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Hooks
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';
import { useProviderModels } from '@/hooks/use-agent-providers.hook';

// Types
import type { AgentProvider, ExecutorStatus, ProviderModel } from '@my-agents/shared';

const NONE_VALUE = '__none__';
const CUSTOM_VALUE = '__custom__';

type ModelOption = {
  value: string;
  label: string;
  source: string;
  providerType?: string;
};

/** Collects model options from static executor presets. */
function collectPresetModels(
  runtimes: ExecutorStatus[],
  providerType: string | undefined,
): { grouped: Map<string, ModelOption[]>; flat: ModelOption[] } {
  const grouped = new Map<string, ModelOption[]>();
  const seen = new Set<string>();
  const flat: ModelOption[] = [];

  for (const rt of runtimes) {
    if (!rt.installed || !rt.modelPresets?.length) continue;
    const group: ModelOption[] = [];
    for (const preset of rt.modelPresets) {
      if (seen.has(preset.value)) continue;
      if (providerType && preset.provider && preset.provider !== providerType) continue;
      seen.add(preset.value);
      const opt: ModelOption = {
        value: preset.value,
        label: preset.label,
        source: rt.name,
        providerType: preset.provider,
      };
      group.push(opt);
      flat.push(opt);
    }
    if (group.length > 0) {
      grouped.set(rt.name, group);
    }
  }

  return { grouped, flat };
}

/** Merges dynamic provider models into the grouped map, deduplicating by value. */
function mergeProviderModels(
  grouped: Map<string, ModelOption[]>,
  flat: ModelOption[],
  providerModels: ProviderModel[],
  providerName: string,
  providerType: string,
): { grouped: Map<string, ModelOption[]>; flat: ModelOption[] } {
  const seen = new Set(flat.map((m) => m.value));
  const dynamicGroup: ModelOption[] = [];

  for (const m of providerModels) {
    if (seen.has(m.value)) continue;
    seen.add(m.value);
    const opt: ModelOption = { value: m.value, label: m.label, source: providerName, providerType };
    dynamicGroup.push(opt);
    flat.push(opt);
  }

  const merged = new Map(grouped);
  if (dynamicGroup.length > 0) {
    merged.set(`${providerName} (API)`, dynamicGroup);
  }
  return { grouped: merged, flat };
}

export type DefaultModelSelectorProps = {
  value: string | null;
  provider: AgentProvider | undefined;
  isPending: boolean;
  onSave: (value: string | null) => void;
};

export function DefaultModelSelector({
  value,
  provider,
  isPending,
  onSave,
}: DefaultModelSelectorProps) {
  const { data: runtimes = [] } = useAgentRuntimes();
  const { data: providerModels = [], isLoading: modelsLoading } = useProviderModels(provider?.id);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string>(NONE_VALUE);
  const [customText, setCustomText] = useState('');

  const { grouped, flat } = useMemo(() => {
    const presets = collectPresetModels(runtimes, provider?.type);
    if (providerModels.length === 0 || !provider) return presets;
    return mergeProviderModels(presets.grouped, [...presets.flat], providerModels, provider.name, provider.type);
  }, [runtimes, provider, providerModels]);

  const startEditing = useCallback(() => {
    if (value) {
      const isPreset = flat.some((m) => m.value === value);
      if (isPreset) {
        setSelected(value);
        setCustomText('');
      } else {
        setSelected(CUSTOM_VALUE);
        setCustomText(value);
      }
    } else {
      setSelected(NONE_VALUE);
      setCustomText('');
    }
    setEditing(true);
  }, [value, flat]);

  const cancel = useCallback(() => setEditing(false), []);

  const save = useCallback(() => {
    let resolved: string | null = null;
    if (selected === CUSTOM_VALUE) {
      resolved = customText.trim() || null;
    } else if (selected !== NONE_VALUE) {
      resolved = selected;
    }
    onSave(resolved);
    setEditing(false);
  }, [selected, customText, onSave]);

  const displayLabel = useMemo(() => {
    if (!value) return null;
    const match = flat.find((m) => m.value === value);
    return match ? match.label : value;
  }, [value, flat]);

  const hasModels = flat.length > 0;

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          Default Model
        </div>
        {!editing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={startEditing}
            aria-label="Edit Default Model"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          {hasModels ? (
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a model..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  <span className="text-muted-foreground">No default — use CLI default</span>
                </SelectItem>
                {[...grouped.entries()].map(([runtimeName, models]) => (
                  <SelectGroup key={runtimeName}>
                    <SelectLabel className="text-xs text-muted-foreground">{runtimeName}</SelectLabel>
                    {models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center gap-2">
                          <span>{m.label}</span>
                          {m.providerType && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {m.providerType}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectItem value={CUSTOM_VALUE}>
                  <span className="italic">Custom model...</span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Enter model name (e.g. opus, gpt-4.1)..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              autoFocus
            />
          )}

          {hasModels && selected === CUSTOM_VALUE && (
            <Input
              placeholder="Enter model name..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              autoFocus
            />
          )}

          {provider && (
            <p className="text-muted-foreground text-xs flex items-center gap-1.5">
              {modelsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              {modelsLoading
                ? `Loading models from ${provider.name}...`
                : `Showing models compatible with ${provider.name} (${provider.type})`}
            </p>
          )}

          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={isPending}>
              <Check className="mr-1 h-3.5 w-3.5" />
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : value ? (
        <button
          type="button"
          className="cursor-pointer rounded-md p-2 text-left transition-colors hover:bg-muted/50"
          onClick={startEditing}
        >
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">{displayLabel}</code>
            {displayLabel !== value && (
              <span className="text-muted-foreground text-xs">({value})</span>
            )}
          </div>
        </button>
      ) : (
        <button
          type="button"
          className="cursor-pointer rounded-md border border-dashed p-4 text-center transition-colors hover:bg-muted/50"
          onClick={startEditing}
        >
          <p className="text-muted-foreground text-xs italic">
            Click to set a default model from your runtimes or provider...
          </p>
        </button>
      )}
    </Card>
  );
}
