// React / library
import { Loader2, Search, Store } from 'lucide-react';
import { useEffect, useState } from 'react';

// Components
import { Input } from '@/components/ui/input';
import { MarketplaceFilters } from './components/MarketplaceFilters';
import { MarketplaceListingCard } from './components/MarketplaceListingCard';

// Hooks
import { useInstallPackage, useMarketplaceSearch } from '@/hooks/use-marketplace.hook';

// Types
import type { MarketplaceListing, PackageType } from '@atlas/shared';

export function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PackageType | undefined>();
  const installPackage = useInstallPackage();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useMarketplaceSearch({
    q: debouncedSearch || undefined,
    type: typeFilter,
    page: 1,
    limit: 20,
  });

  const handleInstall = (listing: MarketplaceListing) => {
    installPackage.mutate({ listing });
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Store className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Browse and install community packages</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <MarketplaceFilters type={typeFilter} onTypeChange={setTypeFilter} />
        </div>

        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && data?.items.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">No packages found</p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((listing) => (
              <MarketplaceListingCard
                key={listing.id}
                listing={listing}
                onInstall={() => handleInstall(listing)}
                isInstalling={installPackage.isPending}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && !data && (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Search for packages to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
