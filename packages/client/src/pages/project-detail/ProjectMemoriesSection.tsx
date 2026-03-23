// React / library
import { Brain } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// Types
import type { ProjectMemoriesSectionProps } from './project-detail-page.types';

// Utilities
import { timeAgo } from '@/lib/format';

export function ProjectMemoriesSection({ memories }: ProjectMemoriesSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Brain className="text-muted-foreground h-4 w-4" />
        <h2 className="text-sm font-semibold">Memories ({memories.length})</h2>
      </div>

      {memories.length === 0 ? (
        <p className="text-muted-foreground text-xs">No memories recorded for this project yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {memories.map((mem) => (
            <Card key={mem.id as string} className="p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{String(mem.scope ?? 'project')}</Badge>
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
