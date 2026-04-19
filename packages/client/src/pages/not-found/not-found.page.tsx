// React / library
import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <FileQuestion className="h-10 w-10 text-muted-foreground/50" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you requested does not exist.</p>
      <Button asChild>
        <Link to="/kanban">Back to Kanban</Link>
      </Button>
    </div>
  );
}
