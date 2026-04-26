// FILE_PATH: packages/client/src/components/onboarding/HelpButton.tsx

// React / library
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpDialog } from './HelpDialog';

// Lib
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';
import { cn } from '@/lib/utils';

type HelpButtonProps = {
  /** Sidebar mode — slim renders icon-only with a tooltip; full shows label. */
  expanded: boolean;
};

/**
 * The "?" entry-point in the sidebar footer. Always available (every shell
 * mode), so the help center is one click away even after a tour is paused.
 */
export function HelpButton({ expanded }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  const trigger = (
    <Button
      variant="ghost"
      size={expanded ? 'sm' : 'icon'}
      className={cn('shrink-0', expanded ? 'h-9 w-full justify-start gap-3 px-3 text-[13px] font-medium' : 'h-9 w-9')}
      onClick={() => setOpen(true)}
      data-tour={TOUR_TARGETS.helpButton}
      aria-label="Help & onboarding"
    >
      <HelpCircle className="h-[18px] w-[18px]" aria-hidden />
      {expanded && <span>Help</span>}
    </Button>
  );

  return (
    <>
      {expanded ? (
        trigger
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">Help &amp; onboarding</TooltipContent>
        </Tooltip>
      )}
      <HelpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
