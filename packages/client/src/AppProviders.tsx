// React / library

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Components
import { TooltipProvider } from '@/components/ui/tooltip';

// Contexts
import { AuthProvider } from '@/contexts/auth.context';
import { ProjectProvider } from '@/contexts/ProjectContext';

// Lib
import { ApiError } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 404) return false;
        return failureCount < 1;
      },
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ProjectProvider>
    </QueryClientProvider>
  );
}
