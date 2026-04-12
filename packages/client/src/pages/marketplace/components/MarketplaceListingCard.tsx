// React / library
import { Download, Star } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types
import type { MarketplaceListing } from '@atlas/shared';

const TYPE_COLORS: Record<string, string> = {
  skill: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  rule: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  agent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  collection: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

type MarketplaceListingCardProps = {
  listing: MarketplaceListing;
  onInstall: () => void;
  isInstalling: boolean;
};

export function MarketplaceListingCard({ listing, onInstall, isInstalling }: MarketplaceListingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm">{listing.name}</CardTitle>
          <Badge className={TYPE_COLORS[listing.type] ?? ''}>{listing.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{listing.author}</span>
          <div className="flex items-center gap-3">
            {listing.downloads != null && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {listing.downloads}
              </span>
            )}
            {listing.rating != null && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {listing.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <Button size="sm" className="w-full" onClick={onInstall} disabled={isInstalling}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {isInstalling ? 'Installing...' : 'Install'}
        </Button>
      </CardContent>
    </Card>
  );
}
