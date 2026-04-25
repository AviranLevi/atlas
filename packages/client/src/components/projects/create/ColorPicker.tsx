// FILE_PATH: packages/client/src/components/projects/create/ColorPicker.tsx

// Constants
import { COLOR_PRESETS } from '../projects.constants';

type ColorPickerProps = {
  color: string | null;
  onChange: (color: string | null) => void;
};

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
            color === c ? 'scale-110 border-foreground' : 'border-transparent'
          }`}
          style={{ backgroundColor: c }}
          onClick={() => onChange(color === c ? null : c)}
          aria-label={`Select color ${c}`}
        />
      ))}
    </div>
  );
}
