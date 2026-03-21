export type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: boolean;
};

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};
