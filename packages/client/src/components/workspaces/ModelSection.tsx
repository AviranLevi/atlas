// React / library
import { Cpu, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

// Components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
import type { ModelPreset } from '@atlas/shared';
import type { ModelSectionProps } from './workspaces.types';

// Constants
import { CUSTOM_MODEL_VALUE, DEFAULT_MODEL_VALUE } from './workspaces.constants';

export function ModelSection({
  runtime,
  agentDefaultModel,
  selectedModel,
  customModelText,
  providerModels,
  providerModelsLoading,
  onModelChange,
  onCustomTextChange,
  showAgentDefault = true,
}: ModelSectionProps) {
  const presets = runtime.modelPresets ?? [];
  const supportsCustom = runtime.supportsCustomModel !== false;

  const extraModels = useMemo(() => {
    const presetValues = new Set(presets.map((p: ModelPreset) => p.value));
    return providerModels.filter((m) => !presetValues.has(m.value));
  }, [presets, providerModels]);

  if (!runtime.modelFlag) return null;

  const hasAnyModels = presets.length > 0 || extraModels.length > 0;

  if (!hasAnyModels && supportsCustom) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          Model
        </Label>
        <Input
          placeholder={runtime.defaultModel ?? 'Enter model name...'}
          value={customModelText}
          onChange={(e) => onCustomTextChange(e.target.value)}
        />
        {providerModelsLoading && (
          <p className="text-muted-foreground text-xs flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading models from provider...
          </p>
        )}
        {agentDefaultModel && showAgentDefault && (
          <p className="text-muted-foreground text-xs">Agent default: {agentDefaultModel}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Cpu className="h-3.5 w-3.5" />
        Model
      </Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger>
          <SelectValue placeholder="Default model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_MODEL_VALUE}>
            <span className="text-muted-foreground">
              Default{runtime.defaultModel ? ` (${runtime.defaultModel})` : ''}
            </span>
          </SelectItem>
          {presets.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">Presets</SelectLabel>
              {presets.map((preset: ModelPreset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {extraModels.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">From Provider</SelectLabel>
              {extraModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {supportsCustom && <SelectItem value={CUSTOM_MODEL_VALUE}>Custom...</SelectItem>}
        </SelectContent>
      </Select>
      {selectedModel === CUSTOM_MODEL_VALUE && (
        <Input
          placeholder="Enter model name..."
          value={customModelText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          autoFocus
        />
      )}
      {providerModelsLoading && (
        <p className="text-muted-foreground text-xs flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading models from provider...
        </p>
      )}
      {agentDefaultModel && showAgentDefault && (
        <p className="text-muted-foreground text-xs">Agent default: {agentDefaultModel}</p>
      )}
    </div>
  );
}
