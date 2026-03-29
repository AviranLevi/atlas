// React / library
import { Save } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Types
import type { GlobalInstructionsCardProps } from './settings-page.types';

export function GlobalInstructionsCard({
  instructions,
  isLoading,
  isDirty,
  isSaving,
  error,
  onChange,
  onSave,
}: GlobalInstructionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Instructions</CardTitle>
        <CardDescription>
          Instructions that apply to every agent regardless of project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading...</div>
        ) : (
          <>
            <Textarea
              value={instructions}
              onChange={(e) => onChange(e.target.value)}
              rows={12}
              placeholder="Enter global instructions..."
              className="resize-none"
            />
            <div className="flex items-center gap-3">
              <Button onClick={onSave} disabled={!isDirty || isSaving}>
                <Save className={`mr-2 h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
