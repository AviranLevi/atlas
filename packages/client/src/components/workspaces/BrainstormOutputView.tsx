// React / library
import { Lightbulb, Star } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types
import type { BrainstormOutput } from '@atlas/shared';

type BrainstormOutputViewProps = {
  brainstorm: BrainstormOutput;
};

export function BrainstormOutputView({ brainstorm }: BrainstormOutputViewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Brainstorm</h3>
      <p className="text-sm text-muted-foreground">{brainstorm.overview}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {brainstorm.ideas.map((idea) => (
          <Card key={idea.title} className={idea.recommended ? 'border-green-300 dark:border-green-700' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4" />
                {idea.title}
                {idea.recommended && (
                  <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Star className="mr-1 h-3 w-3" />
                    Recommended
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{idea.description}</p>
              {idea.tradeoffs.length > 0 && (
                <ul className="list-disc pl-4 space-y-0.5">
                  {idea.tradeoffs.map((t, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{t}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="py-3">
          <p className="text-sm">
            <strong>Recommendation:</strong> {brainstorm.recommendation}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
