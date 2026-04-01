// React / library
import { Brain } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// Lib
import { timeAgo } from '@/lib/format';

// Types
import type { ProjectMemoriesSectionProps } from './project-detail-page.types';

export function ProjectMemoriesSection({ memories }: ProjectMemoriesSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Brain className="text-muted-foreground h-4 w-4" />
        <h2 className="text-sm font-semibold">Memories ({memories.length})</h2>
      </div>

      {memories.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-muted-foreground">
          <Brain className="h-5 w-5 shrink-0 opacity-50" />
          <div>
            <p className="text-xs font-medium">No memories yet</p>
            <p className="text-xs opacity-70">Add memories to give agents persistent context.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {memories.map((mem) => (
            <Card key={mem.id as string} className="p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {String(mem.scope ?? 'project')}
                </Badge>
                <span className="text-muted-foreground text-xs">{timeAgo(String(mem.createdAt))}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm">{String(mem.content ?? '')}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
