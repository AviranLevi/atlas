/** Atlas brand logo — a globe with equator and meridian arcs. */
export function AtlasLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" />
      <path d="M12 3C9.5 6 8 9 8 12C8 15 9.5 18 12 21" />
      <path d="M12 3C14.5 6 16 9 16 12C16 15 14.5 18 12 21" />
    </svg>
  );
}
