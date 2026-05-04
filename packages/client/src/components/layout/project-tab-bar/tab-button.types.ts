export type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  color: string | null;
  label: string;
  icon?: React.ReactNode;
  indicator?: React.ReactNode;
};
