export type AttachableItem = {
  id: string;
  name: string;
  type: string;
};

export type AttachableItemsSectionProps = {
  icon: React.ElementType;
  label: string;
  items: AttachableItem[];
  unattachedItems: AttachableItem[];
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onAttach: (itemId: string) => void;
  onDetach: (itemId: string) => void;
  attachLabel: string;
  emptyMessage: string;
  /** Badge variant for the type label on attached items. */
  badgeVariant?: 'secondary' | 'outline';
};

export type AssignedProject = {
  id: string;
  name: string;
  status: string;
};

export type AssignedProjectsSectionProps = {
  projects: AssignedProject[];
};
