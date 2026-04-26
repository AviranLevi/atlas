// React / library
import { ExternalLink, Store } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const REPO_URL = 'https://github.com/AviranLevi/atlas';

export function MarketplaceComingSoon() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Store className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Atlas Marketplace — coming soon</CardTitle>
          <CardDescription>
            Browse and install community packages — agents, skills, rules, and templates — straight from the Atlas UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">Until then, follow development and contribute on GitHub.</p>
          <Button asChild variant="outline">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              View on GitHub
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
